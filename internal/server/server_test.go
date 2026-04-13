package server_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/mlops-club/bandw/internal/testutil"
)

func TestHealthzReturns200(t *testing.T) {
	h := testutil.NewHarness(t)

	resp, err := http.Get(h.BaseURL + "/healthz")
	if err != nil {
		t.Fatalf("GET /healthz failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var body map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("expected status=ok, got %q", body["status"])
	}
}
