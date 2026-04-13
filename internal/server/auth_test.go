package server_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestAuthRejectsNoCredentials(t *testing.T) {
	h := testutil.NewHarness(t)
	resp, err := http.Post(h.BaseURL+"/graphql", "application/json", nil)
	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)
}

func TestAuthRejectsBadKey(t *testing.T) {
	h := testutil.NewHarness(t)
	req, _ := http.NewRequest("POST", h.BaseURL+"/graphql", nil)
	req.SetBasicAuth("api", "wrong-key")
	resp, err := http.DefaultClient.Do(req)
	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)
}

func TestAuthAcceptsValidKey(t *testing.T) {
	h := testutil.NewHarness(t)
	req, _ := http.NewRequest("POST", h.BaseURL+"/graphql", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth("api", h.APIKey)
	resp, err := http.DefaultClient.Do(req)
	assert.NoError(t, err)
	assert.NotEqual(t, 401, resp.StatusCode) // 404 is fine (no gql handler yet)
}

func TestHealthzSkipsAuth(t *testing.T) {
	h := testutil.NewHarness(t)
	resp, err := http.Get(h.BaseURL + "/healthz")
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}
