# bandw server justfile

# Default: show available recipes
default:
    @just --list

# Build the server binary
build:
    CGO_ENABLED=1 go build -o bin/server ./cmd/server/

# Run the server (requires DATABASE_URL env var or running MySQL via docker)
run: build
    DATABASE_URL="${DATABASE_URL:-wandb:wandb@tcp(127.0.0.1:3306)/wandb?parseTime=true}" ./bin/server

# Run all tests
test:
    CGO_ENABLED=1 go test ./...

# Run tests with verbose output
test-v:
    CGO_ENABLED=1 go test -v ./...

# Start MySQL via docker compose
db-up:
    docker compose up -d

# Stop MySQL
db-down:
    docker compose down

# Tidy go modules
tidy:
    go mod tidy

# Clean build artifacts
clean:
    rm -rf bin/
