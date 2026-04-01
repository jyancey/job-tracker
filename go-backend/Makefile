# @(#)Makefile - Go backend of Job Tracker application
#
# Usage:
#   make build       # Build the application
#   make run         # Build and run the application
#   make dev         # Run the application without building (useful for development)
#   make test        # Run tests
#   make test-cover  # Run tests with coverage report
#   make clean       # Clean build artifacts and coverage reports
#   make tidy        # Clean up go.mod and go.sum files
#

# Default database path (relative to go-backend/)
DB_PATH ?= ../backend/data/job-tracker.sqlite
PORT ?= 3101

build:
	go build -o bin/job-tracker-api ./cmd/server

run: build
	./bin/job-tracker-api -port $(PORT) -db $(DB_PATH)

dev:
	go run ./cmd/server -port $(PORT) -db $(DB_PATH)

test:
	go test ./... -v -count=1

test-cover:
	go test ./... -v -count=1 -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html

clean:
	rm -rf bin/ coverage.out coverage.html

tidy:
	go mod tidy

.PHONY: build run test clean
