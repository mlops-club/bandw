package graphql

import (
	"encoding/json"
	"fmt"
	"strconv"
)

// JSONString represents the JSONString custom scalar (a JSON-encoded string).
type JSONString struct {
	Value string
}

func (JSONString) ImplementsGraphQLType(name string) bool { return name == "JSONString" }

func (j *JSONString) UnmarshalGraphQL(input interface{}) error {
	switch v := input.(type) {
	case string:
		j.Value = v
		return nil
	default:
		return fmt.Errorf("JSONString must be a string, got %T", input)
	}
}

func (j JSONString) MarshalJSON() ([]byte, error) {
	return json.Marshal(j.Value)
}

// DateTime represents the DateTime custom scalar (RFC3339 time string).
type DateTime struct {
	Value string
}

func (DateTime) ImplementsGraphQLType(name string) bool { return name == "DateTime" }

func (d *DateTime) UnmarshalGraphQL(input interface{}) error {
	switch v := input.(type) {
	case string:
		d.Value = v
		return nil
	default:
		return fmt.Errorf("DateTime must be a string, got %T", input)
	}
}

func (d DateTime) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Value)
}

// Int64Scalar represents the Int64 custom scalar for large integer values.
type Int64Scalar int64

func (Int64Scalar) ImplementsGraphQLType(name string) bool { return name == "Int64" }

func (s *Int64Scalar) UnmarshalGraphQL(input interface{}) error {
	switch v := input.(type) {
	case float64:
		*s = Int64Scalar(int64(v))
	case int:
		*s = Int64Scalar(int64(v))
	case int32:
		*s = Int64Scalar(int64(v))
	case int64:
		*s = Int64Scalar(v)
	case string:
		n, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return err
		}
		*s = Int64Scalar(n)
	default:
		return fmt.Errorf("Int64 must be a number, got %T", input)
	}
	return nil
}

func (s Int64Scalar) MarshalJSON() ([]byte, error) {
	return json.Marshal(int64(s))
}

// JSONScalar represents the JSON custom scalar (arbitrary JSON value).
type JSONScalar struct {
	Value interface{}
}

func (JSONScalar) ImplementsGraphQLType(name string) bool { return name == "JSON" }

func (j *JSONScalar) UnmarshalGraphQL(input interface{}) error {
	j.Value = input
	return nil
}

func (j JSONScalar) MarshalJSON() ([]byte, error) {
	return json.Marshal(j.Value)
}

