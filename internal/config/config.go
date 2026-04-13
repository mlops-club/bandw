package config

import "os"

type Config struct {
	Port        string
	DatabaseURL string
}

func Load() Config {
	c := Config{
		Port:        "8080",
		DatabaseURL: "",
	}
	if v := os.Getenv("PORT"); v != "" {
		c.Port = v
	}
	if v := os.Getenv("DATABASE_URL"); v != "" {
		c.DatabaseURL = v
	}
	return c
}
