package graphql

// ServerInfoResolver implements the ServerInfo type with static responses.
type ServerInfoResolver struct{}

func (s *ServerInfoResolver) CliVersionInfo() *JSONScalar {
	return &JSONScalar{Value: map[string]interface{}{
		"max_cli_version": "0.26.0",
	}}
}
func (s *ServerInfoResolver) LatestLocalVersionInfo() *LocalVersionInfoResolver { return nil }
func (s *ServerInfoResolver) Features() []*ServerFeatureResolver                { return []*ServerFeatureResolver{} }

// LocalVersionInfoResolver implements the LocalVersionInfo type.
type LocalVersionInfoResolver struct{}

func (l *LocalVersionInfoResolver) OutOfDate() bool                     { return false }
func (l *LocalVersionInfoResolver) LatestVersionString() string         { return "0.0.0" }
func (l *LocalVersionInfoResolver) VersionOnThisInstanceString() string { return "0.0.0" }

// ServerFeatureResolver implements the ServerFeature type.
type ServerFeatureResolver struct {
	name    string
	enabled bool
}

func (f *ServerFeatureResolver) Name() string    { return f.name }
func (f *ServerFeatureResolver) IsEnabled() bool { return f.enabled }
