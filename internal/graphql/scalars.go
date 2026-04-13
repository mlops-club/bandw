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
