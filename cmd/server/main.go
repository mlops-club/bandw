package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mlops-club/bandw/internal/config"
	"github.com/mlops-club/bandw/internal/server"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	var db *gorm.DB
	var err error
	if cfg.DatabaseURL == "" {
		log.Println("DATABASE_URL not set, using in-memory SQLite")
		db, err = store.NewSQLiteDB()
	} else {
		db, err = store.NewMySQLDB(cfg.DatabaseURL)
	}
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	if err := store.AutoMigrate(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}
	if err := store.SeedDefaults(db); err != nil {
		log.Fatalf("failed to seed defaults: %v", err)
	}

	router := server.NewRouter(db)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
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
