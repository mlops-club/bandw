package graphql

// SchemaString is the minimal GraphQL SDL needed for wandb login.
// It covers Query.viewer, Query.serverInfo, and ServerFeatures.
const SchemaString = `
scalar JSONString
scalar JSON

type Query {
	viewer: User!
	serverInfo: ServerInfo!
}

type User {
	id: ID!
	entity: String
	username: String
	email: String
	name: String
	flags: JSONString
	teams: EntityConnection!
}

type EntityConnection {
	edges: [EntityEdge!]!
	pageInfo: PageInfo!
}

type EntityEdge {
	node: Entity
	cursor: String
}

type Entity {
	id: ID!
	name: String!
}

type PageInfo {
	hasNextPage: Boolean!
	hasPreviousPage: Boolean!
	startCursor: String
	endCursor: String
}

type ServerInfo {
	cliVersionInfo: JSON
	latestLocalVersionInfo: LocalVersionInfo
	features: [ServerFeature!]!
}

type LocalVersionInfo {
	outOfDate: Boolean!
	latestVersionString: String!
	versionOnThisInstanceString: String!
}

type ServerFeature {
	name: String!
	isEnabled: Boolean!
}
`
