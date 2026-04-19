package graphql

import "math"

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// safeInt32 converts an int to int32, clamping to [0, MaxInt32] to prevent overflow.
func safeInt32(v int) int32 {
	if v > math.MaxInt32 {
		return math.MaxInt32
	}
	if v < 0 {
		return 0
	}
	return int32(v) //#nosec G115 -- bounds checked above
}

// safeInt64ToInt32 converts an int64 to int32, clamping to [0, MaxInt32].
func safeInt64ToInt32(v int64) int32 {
	if v > math.MaxInt32 {
		return math.MaxInt32
	}
	if v < 0 {
		return 0
	}
	return int32(v) //#nosec G115 -- bounds checked above
}
