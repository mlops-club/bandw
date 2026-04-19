package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"fmt"

	"github.com/mlops-club/bandw/internal/config"
	"github.com/mlops-club/bandw/internal/server"
	"github.com/mlops-club/bandw/internal/storage"
	"github.com/mlops-club/bandw/internal/store"
)

func main() {
	cfg := config.Load()
	config.ParseFlags(&cfg, os.Args[1:])

	dialect, dsn := cfg.ResolveDB()
	log.Printf("database: dialect=%s dsn=%s", dialect, dsn)

	// Create parent directories for SQLite file if needed.
	if dialect == "sqlite" && dsn != ":memory:" {
		dir := filepath.Dir(dsn)
		if err := os.MkdirAll(dir, 0o750); err != nil {
			log.Fatalf("failed to create directory %s: %v", dir, err)
		}
	}

	db, err := store.NewDBFromConfig(dialect, dsn)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	if err := store.AutoMigrate(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}
	if err := store.SeedDefaults(db); err != nil {
		log.Fatalf("failed to seed defaults: %v", err)
	}

	// Set up local file storage for artifacts.
	storageDir := os.Getenv("BANDW_STORAGE_DIR")
	if storageDir == "" {
		storageDir = "./data/storage"
	}
	baseURL := fmt.Sprintf("http://localhost:%s", cfg.Port)
	if v := os.Getenv("BANDW_BASE_URL"); v != "" {
		baseURL = v
	}
	localStorage, err := storage.NewLocalStorage(storageDir, baseURL)
	if err != nil {
		log.Fatalf("failed to create local storage: %v", err)
	}
	log.Printf("storage: dir=%s baseURL=%s", storageDir, baseURL) //#nosec G706 -- log output, not user-facing

	router := server.NewRouterWithStorage(db, localStorage)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("server listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-done
	log.Println("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}
	log.Println("server stopped")
}
