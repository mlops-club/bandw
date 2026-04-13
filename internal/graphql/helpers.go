package graphql

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
