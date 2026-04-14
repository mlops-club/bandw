package graphql

import (
	"encoding/json"
	"fmt"
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
