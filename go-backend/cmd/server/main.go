/* @(#)main.go - Entry point for the job-tracker-api server.
 *
 * Initializes configuration, database, and starts the HTTP server with
 * graceful shutdown support.
 *
 * Copyright (c) 2026 John Yancey. All rights reserved.
 */
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/john/job-tracker-api/internal/config"
	"github.com/john/job-tracker-api/internal/database"
	"github.com/john/job-tracker-api/internal/server"
)

func main() {
	cfg := config.Load()

	slog.Info("starting job-tracker-api",
		"port", cfg.Port,
		"db", cfg.DBPath,
		"cors", cfg.CORSOrigins,
	)

	db, err := database.Open(cfg.DBPath)
	if err != nil {
		slog.Error("failed to open database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := database.EnsureAllSchema(db); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}

	handler := server.New(db, cfg.DBPath, cfg.CORSOrigins)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("server listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-done
	slog.Info("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "error", err)
	}
	slog.Info("server stopped")
}
