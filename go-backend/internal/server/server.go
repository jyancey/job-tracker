package server

import (
	"database/sql"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/john/job-tracker-api/internal/handler"
	"github.com/john/job-tracker-api/internal/repository"
)

// New creates a configured HTTP handler with all routes and middleware.
func New(db *sql.DB, dbPath string, corsOrigins []string) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(handler.RequestLogger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(handler.JSONContentType)

	// Repositories
	jobRepo := repository.NewJobRepository(db)
	aiConfigRepo := repository.NewAIConfigRepository(db)
	profileRepo := repository.NewUserProfileRepository(db)

	// Handlers
	jobHandler := handler.NewJobHandler(jobRepo)
	aiConfigHandler := handler.NewAIConfigHandler(aiConfigRepo)
	profileHandler := handler.NewUserProfileHandler(profileRepo)
	dbHandler := handler.NewDatabaseHandler(db, dbPath)

	// Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", dbHandler.Health)

		// Jobs - individual CRUD
		r.Get("/jobs", jobHandler.List)
		r.Post("/jobs", jobHandler.Create)
		r.Put("/jobs", jobHandler.ReplaceAll)
		r.Delete("/jobs", jobHandler.DeleteBulk)
		r.Get("/jobs/{id}", jobHandler.GetByID)
		r.Patch("/jobs/{id}", jobHandler.Update)
		r.Delete("/jobs/{id}", jobHandler.Delete)

		// AI Config
		r.Get("/config", aiConfigHandler.Get)
		r.Post("/config", aiConfigHandler.Save)
		r.Put("/config", aiConfigHandler.Save)

		// User Profile
		r.Get("/profile", profileHandler.Get)
		r.Post("/profile", profileHandler.Save)
		r.Put("/profile", profileHandler.Save)

		// Database admin
		r.Get("/database/info", dbHandler.Info)
		r.Post("/database/create", dbHandler.Create)
		r.Get("/database/test", dbHandler.Test)
	})

	return r
}
