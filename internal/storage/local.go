package storage

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

// LocalStorage stores artifact files on the local filesystem.
type LocalStorage struct {
	RootDir string // base directory for stored files
	BaseURL string // server base URL for constructing download/upload URLs
}

// NewLocalStorage creates a LocalStorage, ensuring the root directory exists.
func NewLocalStorage(rootDir, baseURL string) (*LocalStorage, error) {
	if err := os.MkdirAll(rootDir, 0o750); err != nil {
		return nil, fmt.Errorf("failed to create storage dir %s: %w", rootDir, err)
	}
	return &LocalStorage{RootDir: rootDir, BaseURL: strings.TrimRight(baseURL, "/")}, nil
}

// StoragePath returns the path to use for a file, given an artifact ID and filename.
func (s *LocalStorage) StoragePath(artifactID, filename string) string {
	return filepath.Join("artifacts", artifactID, filename)
}

// UploadURL returns the URL the SDK should PUT file content to.
func (s *LocalStorage) UploadURL(storagePath string) string {
	return s.BaseURL + "/upload/" + storagePath
}

// DirectURL returns the URL to GET file content from.
func (s *LocalStorage) DirectURL(storagePath string) string {
	return s.BaseURL + "/storage/" + storagePath
}

// validatePath ensures the resolved path stays within the root directory.
func (s *LocalStorage) validatePath(storagePath string) (string, error) {
	fullPath := filepath.Join(s.RootDir, filepath.Clean(storagePath))
	absRoot, _ := filepath.Abs(s.RootDir)
	absPath, _ := filepath.Abs(fullPath)
	if !strings.HasPrefix(absPath, absRoot+string(filepath.Separator)) && absPath != absRoot {
		return "", fmt.Errorf("path traversal detected: %s", storagePath)
	}
	return fullPath, nil
}

// Save writes content from a reader to the given storage path.
func (s *LocalStorage) Save(storagePath string, r io.Reader) (int64, error) {
	fullPath, err := s.validatePath(storagePath)
	if err != nil {
		return 0, err
	}
	if err := os.MkdirAll(filepath.Dir(fullPath), 0o750); err != nil {
		return 0, err
	}
	f, err := os.Create(fullPath) //#nosec G304 -- path validated by validatePath above
	if err != nil {
		return 0, err
	}
	defer f.Close()
	return io.Copy(f, r)
}

// Open returns a ReadCloser for the given storage path.
func (s *LocalStorage) Open(storagePath string) (io.ReadCloser, error) {
	fullPath, err := s.validatePath(storagePath)
	if err != nil {
		return nil, err
	}
	return os.Open(fullPath) //#nosec G304 -- path validated by validatePath above
}

// UploadHandler returns an http.HandlerFunc for PUT /upload/{storagePath...}
func (s *LocalStorage) UploadHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		storagePath := chi.URLParam(r, "*")
		if storagePath == "" {
			http.Error(w, "missing storage path", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
		_, err := s.Save(storagePath, r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

// DownloadHandler returns an http.HandlerFunc for GET /storage/{storagePath...}
func (s *LocalStorage) DownloadHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		storagePath := chi.URLParam(r, "*")
		if storagePath == "" {
			http.Error(w, "missing storage path", http.StatusBadRequest)
			return
		}
		rc, err := s.Open(storagePath)
		if err != nil {
			if os.IsNotExist(err) {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rc.Close()
		w.Header().Set("Content-Type", "application/octet-stream")
		_, _ = io.Copy(w, rc)
	}
}
