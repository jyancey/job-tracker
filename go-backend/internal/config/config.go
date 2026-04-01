package config

import (
	"flag"
	"os"
	"strconv"
)

// Config holds the server configuration.
type Config struct {
	Port        int
	DBPath      string
	CORSOrigins []string
}

// Load parses configuration from command-line flags and environment variables.
// Environment variables take precedence over flags.
func Load() Config {
	port := flag.Int("port", 3101, "HTTP server port")
	dbPath := flag.String("db", "", "Path to SQLite database file")
	corsOrigins := flag.String("cors", "http://127.0.0.1:4173,http://localhost:4173", "Comma-separated CORS origins")
	flag.Parse()

	cfg := Config{
		Port:        *port,
		DBPath:      *dbPath,
		CORSOrigins: splitOrigins(*corsOrigins),
	}

	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil {
			cfg.Port = p
		}
	}
	if envDB := os.Getenv("JOB_TRACKER_DB_PATH"); envDB != "" {
		cfg.DBPath = envDB
	}
	if envCORS := os.Getenv("CORS_ORIGINS"); envCORS != "" {
		cfg.CORSOrigins = splitOrigins(envCORS)
	}

	if cfg.DBPath == "" {
		cfg.DBPath = defaultDBPath()
	}

	return cfg
}

func splitOrigins(s string) []string {
	var origins []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			if start < i {
				origins = append(origins, s[start:i])
			}
			start = i + 1
		}
	}
	if start < len(s) {
		origins = append(origins, s[start:])
	}
	return origins
}

func defaultDBPath() string {
	// Default: sibling path matching the existing TypeScript backend location
	return "../backend/data/job-tracker.sqlite"
}
