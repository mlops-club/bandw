package graphql

// SchemaString is the GraphQL SDL for the bandw server.
// Covers: viewer, serverInfo, upsertBucket, model/project queries.
const SchemaString = `
scalar JSONString
scalar JSON
scalar DateTime

type Query {
	viewer: User!
	serverInfo: ServerInfo!
	model(name: String, entityName: String): Project
	project(name: String, entityName: String): Project
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
	inserted: Boolean
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

type Project {
	id: ID!
	name: String!
	entityName: String
	entity: Entity!
	description: String
	createdAt: DateTime
	isBenchmark: Boolean
	readOnly: Boolean
	bucket(name: String!, missingOk: Boolean): Run
	run(name: String!): Run
	runs(first: Int, after: String, order: String): RunConnection!
}

type RunConnection {
	edges: [RunEdge!]!
	pageInfo: PageInfo!
	totalCount: Int!
}

type RunEdge {
	node: Run
	cursor: String
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
	stopped: Boolean
	createdAt: DateTime
	updatedAt: DateTime
	heartbeatAt: DateTime
	historyLineCount: Int
	logLineCount: Int
	eventsLineCount: Int
	project: Project
	user: User
	tags: [String!]
	readOnly: Boolean
}
`
