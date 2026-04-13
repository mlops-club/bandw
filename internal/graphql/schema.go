package graphql

// SchemaString is the GraphQL SDL for the bandw server.
// It covers Query.viewer, Query.serverInfo, Query.model, Query.models,
// and Mutation.upsertBucket.
const SchemaString = `
scalar JSONString
scalar JSON
scalar DateTime

type Query {
	viewer: User!
	serverInfo: ServerInfo!
	model(name: String!, entityName: String!): Project
	models(entityName: String!, first: Int, after: String): ProjectConnection!
}

type Mutation {
	upsertBucket(input: UpsertBucketInput!): UpsertBucketPayload
}

input UpsertBucketInput {
	id: String
	name: String
	groupName: String
	modelName: String
	entityName: String
	description: String
	displayName: String
	notes: String
	config: JSONString
	commit: String
	host: String
	debug: Boolean
	jobProgram: String
	jobRepo: String
	jobType: String
	state: String
	sweep: String
	tags: [String!]
	summaryMetrics: JSONString
}

type UpsertBucketPayload {
	bucket: Run
	inserted: Boolean!
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

type Run {
	id: ID!
	name: String!
	displayName: String
	description: String
	notes: String
	config: JSONString
	summaryMetrics: JSONString
	sweepName: String
	state: String
	group: String
	jobType: String
	commit: String
	host: String
	createdAt: DateTime
	updatedAt: DateTime
	heartbeatAt: DateTime
	tags: [String!]
	stopped: Boolean!
	readOnly: Boolean!
	historyLineCount: Int!
	logLineCount: Int!
	eventsLineCount: Int!
	user: User
	project: Project
}

type Project {
	id: ID!
	name: String!
	entityName: String!
	entity: Entity!
	description: String
	createdAt: DateTime
	isBenchmark: Boolean!
	readOnly: Boolean!
	bucket(name: String!, missingOk: Boolean): Run
	buckets(first: Int, after: String): RunConnection!
	runs(first: Int, after: String): RunConnection!
}

type ProjectConnection {
	edges: [ProjectEdge!]!
	pageInfo: PageInfo!
}

type ProjectEdge {
	node: Project
	cursor: String
}

type RunConnection {
	edges: [RunEdge!]!
	pageInfo: PageInfo!
}

type RunEdge {
	node: Run
	cursor: String
}
`
