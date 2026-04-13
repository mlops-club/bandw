package graphql_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestViewerReturnsEntity(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`query { viewer { id entity } }`)
	assert.Equal(t, "admin", resp.Path("data.viewer.entity").String())
	assert.NotEmpty(t, resp.Path("data.viewer.id").String())
}

func TestViewerReturnsTeams(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`query { viewer { teams { edges { node { name } } } } }`)
	assert.False(t, resp.Path("errors").Exists())
}

func TestServerInfoReturnsMinimal(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`query { serverInfo { cliVersionInfo } }`)
	assert.False(t, resp.Path("errors").Exists())
	assert.True(t, resp.Path("data.serverInfo").Exists())
}

func TestServerFeaturesReturnsEmptyArray(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`query { serverInfo { features { name isEnabled } } }`)
	features := resp.Path("data.serverInfo.features")
	assert.True(t, features.Exists())
	assert.True(t, features.IsArray())
	assert.Equal(t, 0, len(features.Array()))
}

func TestCombinedViewerServerInfo(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`query {
		viewer { id entity flags teams { edges { node { name } } } }
		serverInfo { cliVersionInfo latestLocalVersionInfo {
			outOfDate latestVersionString versionOnThisInstanceString
		} }
	}`)
	assert.False(t, resp.Path("errors").Exists())
	assert.NotEmpty(t, resp.Path("data.viewer.entity").String())
}
