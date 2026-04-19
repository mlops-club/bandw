package graphql

// SchemaString is the GraphQL SDL for the bandw server.
// Covers: viewer, serverInfo, upsertBucket, model/project queries.
const SchemaString = `
scalar JSONString
scalar JSON
scalar DateTime
scalar Int64

type Query {
	viewer: User!
	serverInfo: ServerInfo!
	model(name: String, entityName: String): Project
	project(name: String, entityName: String): Project
	projects(entityName: String!): ProjectConnection!

	# ── Artifact top-level queries ──
	artifact(id: ID!): Artifact
	artifactCollection(id: ID!): ArtifactCollection
	clientIDMapping(clientID: ID!): ClientIDMappingResult
}

type ProjectConnection {
	edges: [ProjectEdge!]!
	pageInfo: PageInfo!
}

type ProjectEdge {
	node: Project
	cursor: String
}

type Mutation {
	upsertBucket(input: UpsertBucketInput!): UpsertBucketPayload

	# ── Artifact mutations ──
	createArtifact(input: CreateArtifactInput!): CreateArtifactPayload
	createArtifactManifest(input: CreateArtifactManifestInput!): CreateArtifactManifestPayload
	createArtifactFiles(input: CreateArtifactFilesInput!): CreateArtifactFilesPayload
	completeMultipartUploadArtifact(input: CompleteMultipartUploadArtifactInput!): CompleteMultipartUploadArtifactPayload
	updateArtifactManifest(input: UpdateArtifactManifestInput!): UpdateArtifactManifestPayload
	commitArtifact(input: CommitArtifactInput!): CommitArtifactPayload
	useArtifact(input: UseArtifactInput!): UseArtifactPayload
	updateArtifact(input: UpdateArtifactInput!): UpdateArtifactPayload
	addAliases(input: AddAliasesInput!): AddAliasesPayload
	deleteAliases(input: DeleteAliasesInput!): DeleteAliasesPayload
	linkArtifact(input: LinkArtifactInput!): LinkArtifactPayload
	unlinkArtifact(input: UnlinkArtifactInput!): UnlinkArtifactPayload
	deleteArtifact(input: DeleteArtifactInput!): DeleteArtifactPayload
	deleteArtifactSequence(input: DeleteArtifactSequenceInput!): DeleteArtifactSequencePayload
	deleteArtifactPortfolio(input: DeleteArtifactPortfolioInput!): DeleteArtifactPortfolioPayload
	updateArtifactSequence(input: UpdateArtifactSequenceInput!): UpdateArtifactSequencePayload
	updateArtifactPortfolio(input: UpdateArtifactPortfolioInput!): UpdateArtifactPortfolioPayload
	moveArtifactSequence(input: MoveArtifactSequenceInput!): MoveArtifactSequencePayload
	createArtifactType(input: CreateArtifactTypeInput!): CreateArtifactTypePayload
	createArtifactCollectionTagAssignments(input: CreateArtifactCollectionTagAssignmentsInput!): CreateArtifactCollectionTagAssignmentsPayload
	deleteArtifactCollectionTagAssignments(input: DeleteArtifactCollectionTagAssignmentsInput!): DeleteArtifactCollectionTagAssignmentsPayload
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
	runCount: Int!
	lastRunAt: DateTime
	bucket(name: String!, missingOk: Boolean): Run
	run(name: String!): Run
	runs(first: Int, after: String, order: String): RunConnection!

	# ── Artifact queries on project ──
	artifact(name: String!, enableTracking: Boolean): Artifact
	artifactType(name: String!): ArtifactType
	artifactTypes(after: String, first: Int, includeAll: Boolean): ArtifactTypeConnection!
	artifactCollection(name: String!): ArtifactCollection
	artifactCollections(after: String, first: Int, filters: JSONString, order: String): ArtifactCollectionConnection!
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
	history(minStep: Int64, maxStep: Int64, samples: Int): [JSONString!]
	sampledHistory(specs: [JSONString!]!): [JSON]
	historyKeys: JSON
	logLines(offset: Int, limit: Int): LogLineConnection!
	inputArtifacts(after: String, first: Int): ArtifactConnection
	outputArtifacts(after: String, first: Int): ArtifactConnection
}

type LogLineConnection {
	edges: [LogLineEdge!]!
	totalCount: Int!
}

type LogLineEdge {
	node: LogLine
}

type LogLine {
	lineNum: Int!
	content: String!
	stream: String!
}

# ══════════════════════════════════════════════════════════════════
# ARTIFACT ENUMS
# ══════════════════════════════════════════════════════════════════

enum ArtifactState           { PENDING, COMMITTED, DELETED }
enum ArtifactManifestType    { FULL, INCREMENTAL, PATCH }
enum ArtifactStorageLayout   { V1, V2 }
enum ArtifactDigestAlgorithm { MANIFEST_MD5 }
enum ArtifactCollectionType  { SEQUENCE, PORTFOLIO }
enum CompleteMultipartAction  { Complete }

# ══════════════════════════════════════════════════════════════════
# ARTIFACT TYPES
# ══════════════════════════════════════════════════════════════════

type Artifact {
	id: ID!
	state: ArtifactState!
	digest: String!
	commitHash: String
	description: String
	metadata: JSONString
	versionIndex: Int
	size: Int64
	fileCount: Int
	createdAt: DateTime
	updatedAt: DateTime
	ttlDurationSeconds: Int64
	ttlIsInherited: Boolean
	historyStep: Int64

	artifactType: ArtifactType!
	artifactSequence: ArtifactSequence!
	currentManifest: ArtifactManifest
	aliases: [ArtifactAlias!]
	tags: [Tag!]

	files(names: [String], after: String, first: Int): FileConnection
	filesByManifestEntries(
		storageLayout: String!
		manifestVersion: String!
		entries: [ArtifactManifestEntryInput!]
		storageRegion: String
	): FileConnection

	createdBy: ArtifactCreator
	usedBy: RunConnection
	artifactMemberships: ArtifactMembershipConnection
}

union ArtifactCreator = Run

type ArtifactType {
	id: ID!
	name: String!
	description: String
	createdAt: DateTime
	artifact(name: String!): Artifact
	artifactCollection(name: String!): ArtifactCollection
	artifactCollections(
		after: String, first: Int,
		filters: JSONString, order: String
	): ArtifactCollectionConnection
}

type ArtifactSequence {
	id: ID!
	name: String!
	description: String
	createdAt: DateTime
	updatedAt: DateTime
	project: Project
	latestArtifact: Artifact
	defaultArtifactType: ArtifactType
	tags: TagConnection
}

type ArtifactCollection {
	id: ID!
	name: String!
	description: String
	state: String
	createdAt: DateTime
	updatedAt: DateTime
	project: Project
	defaultArtifactType: ArtifactType

	aliases(after: String, first: Int): ArtifactAliasConnection
	artifacts(
		after: String, first: Int,
		order: String, filters: JSONString
	): ArtifactConnection
	artifactMembership(aliasName: String!): ArtifactCollectionMembership
	tags: TagConnection
}

type ArtifactManifest {
	id: ID!
	file: File!
}

type ArtifactAlias {
	id: ID!
	alias: String!
	artifactCollection: ArtifactCollection
}

type ArtifactCollectionMembership {
	id: ID!
	versionIndex: Int
	artifact: Artifact
	aliases: [ArtifactAlias!]
	artifactCollection: ArtifactCollection
	files(names: [String], after: String, first: Int): FileConnection
}

type Tag {
	id: ID!
	name: String!
}

type File {
	id: ID!
	name: String!
	displayName: String
	url(upload: Boolean): String
	directUrl: String
	uploadUrl: String
	uploadHeaders: [String!]
	uploadMultipartUrls: UploadMultipartUrls
	storagePath: String
	sizeBytes: Int64
	md5: String
	digest: String
	mimetype: String
	updatedAt: DateTime
	artifact: Artifact
}

type UploadMultipartUrls {
	uploadID: String!
	uploadUrlParts: [UploadUrlPart!]!
}

type UploadUrlPart {
	partNumber: Int64!
	uploadUrl: String!
}

type ClientIDMappingResult {
	id: ID!
}

# ══════════════════════════════════════════════════════════════════
# ARTIFACT CONNECTION TYPES
# ══════════════════════════════════════════════════════════════════

type ArtifactConnection {
	edges: [ArtifactEdge!]!
	pageInfo: PageInfo!
	totalCount: Int
}

type ArtifactEdge {
	node: Artifact
	cursor: String
}

type ArtifactCollectionConnection {
	edges: [ArtifactCollectionEdge!]!
	pageInfo: PageInfo!
	totalCount: Int
}

type ArtifactCollectionEdge {
	node: ArtifactCollection
	cursor: String
}

type ArtifactAliasConnection {
	edges: [ArtifactAliasEdge!]!
	pageInfo: PageInfo!
}

type ArtifactAliasEdge {
	node: ArtifactAlias
	cursor: String
}

type ArtifactMembershipConnection {
	edges: [ArtifactMembershipEdge!]!
	pageInfo: PageInfo!
}

type ArtifactMembershipEdge {
	node: ArtifactCollectionMembership
	cursor: String
}

type TagConnection {
	edges: [TagEdge!]!
	pageInfo: PageInfo!
}

type TagEdge {
	node: Tag
	cursor: String
}

type FileConnection {
	edges: [FileEdge!]!
	pageInfo: PageInfo!
}

type FileEdge {
	node: File
	cursor: String
}

type ArtifactTypeConnection {
	edges: [ArtifactTypeEdge!]!
	pageInfo: PageInfo!
}

type ArtifactTypeEdge {
	node: ArtifactType
	cursor: String
}

# ══════════════════════════════════════════════════════════════════
# ARTIFACT INPUTS
# ══════════════════════════════════════════════════════════════════

input CreateArtifactInput {
	entityName: String!
	projectName: String!
	runName: String
	artifactTypeName: String!
	artifactCollectionName: String!
	artifactCollectionNames: [String!]!
	digest: String!
	digestAlgorithm: ArtifactDigestAlgorithm!
	description: String
	metadata: JSONString
	labels: JSONString
	aliases: [ArtifactAliasInput!]!
	clientID: String!
	sequenceClientID: String!
	enableDigestDeduplication: Boolean!
	historyStep: Int64
	distributedID: String
	clientMutationId: String
	ttlDurationSeconds: Int64
	tags: [TagInput!]
	storageRegion: String
}

input CreateArtifactManifestInput {
	artifactID: ID!
	baseArtifactID: ID
	name: String!
	digest: String!
	entityName: String!
	projectName: String!
	runName: String!
	type: ArtifactManifestType!
	includeUpload: Boolean
}

input CreateArtifactFilesInput {
	artifactFiles: [CreateArtifactFileSpecInput!]!
	storageLayout: ArtifactStorageLayout!
}

input CreateArtifactFileSpecInput {
	artifactID: ID!
	artifactManifestID: ID
	name: String!
	md5: String!
	mimetype: String
	uploadPartsInput: [UploadPartsInput!]
}

input UploadPartsInput {
	hexMD5: String!
	partNumber: Int64!
}

input CompleteMultipartUploadArtifactInput {
	completeMultipartAction: CompleteMultipartAction!
	completedParts: [UploadPartsInput!]!
	artifactID: ID!
	storagePath: String!
	uploadID: String!
}

input UpdateArtifactManifestInput {
	artifactManifestID: ID!
	digest: String
	baseArtifactID: ID
}

input CommitArtifactInput {
	artifactID: ID!
}

input UseArtifactInput {
	entityName: String!
	projectName: String!
	runName: String!
	artifactID: ID!
	usedAs: String
	clientMutationId: String
	artifactEntityName: String
	artifactProjectName: String
}

input UpdateArtifactInput {
	artifactID: ID!
	description: String
	metadata: JSONString
	aliases: [ArtifactAliasInput!]
	ttlDurationSeconds: Int64
	tags: [TagInput!]
}

input ArtifactAliasInput {
	alias: String!
	artifactCollectionName: String!
}

input AddAliasesInput {
	artifactID: ID!
	aliases: [ArtifactAliasInput!]!
}

input DeleteAliasesInput {
	artifactID: ID!
	aliases: [ArtifactAliasInput!]!
}

input LinkArtifactInput {
	artifactPortfolioName: String!
	entityName: String!
	projectName: String!
	artifactID: ID
	clientID: ID
	aliases: [ArtifactAliasInput!]
}

input UnlinkArtifactInput {
	artifactID: ID!
	portfolioName: String!
	entityName: String!
	projectName: String!
}

input DeleteArtifactInput {
	artifactID: ID!
	deleteAliases: Boolean
}

input DeleteArtifactSequenceInput  { artifactSequenceID: ID! }
input DeleteArtifactPortfolioInput { artifactPortfolioID: ID! }

input UpdateArtifactSequenceInput {
	artifactSequenceID: ID!
	name: String
	description: String
	tags: [TagInput!]
}

input UpdateArtifactPortfolioInput {
	artifactPortfolioID: ID!
	name: String
	description: String
}

input MoveArtifactSequenceInput {
	artifactSequenceID: ID!
	destinationArtifactTypeName: String!
}

input CreateArtifactTypeInput {
	entityName: String!
	projectName: String!
	name: String!
	description: String
}

input TagInput {
	tagName: String!
	tagCategoryName: String
	attributes: String
}

input CreateArtifactCollectionTagAssignmentsInput {
	artifactCollectionID: ID!
	tags: [TagInput!]!
}

input DeleteArtifactCollectionTagAssignmentsInput {
	artifactCollectionID: ID!
	tags: [TagInput!]!
}

input ArtifactManifestEntryInput {
	name: String!
	digest: String!
	birthArtifactID: String
	storageRegion: String
}

# ══════════════════════════════════════════════════════════════════
# ARTIFACT PAYLOADS
# ══════════════════════════════════════════════════════════════════

type CreateArtifactPayload         { artifact: Artifact! }
type CreateArtifactManifestPayload { artifactManifest: ArtifactManifest! }
type CreateArtifactFilesPayload    { files: FileConnection! }
type CompleteMultipartUploadArtifactPayload { digest: String }
type UpdateArtifactManifestPayload { artifactManifest: ArtifactManifest! }
type CommitArtifactPayload         { artifact: Artifact! }
type UseArtifactPayload            { artifact: Artifact! }
type UpdateArtifactPayload         { artifact: Artifact! }
type AddAliasesPayload             { success: Boolean! }
type DeleteAliasesPayload          { success: Boolean! }
type LinkArtifactPayload           { versionIndex: Int, artifactMembership: ArtifactCollectionMembership }
type UnlinkArtifactPayload         { success: Boolean! }
type DeleteArtifactPayload         { artifact: Artifact }
type DeleteArtifactSequencePayload  { artifactCollection: ArtifactCollection }
type DeleteArtifactPortfolioPayload { artifactCollection: ArtifactCollection }
type UpdateArtifactSequencePayload  { artifactCollection: ArtifactCollection }
type UpdateArtifactPortfolioPayload { artifactCollection: ArtifactCollection }
type MoveArtifactSequencePayload    { artifactCollection: ArtifactCollection }
type CreateArtifactTypePayload      { artifactType: ArtifactType! }
type CreateArtifactCollectionTagAssignmentsPayload { tags: [Tag!] }
type DeleteArtifactCollectionTagAssignmentsPayload { success: Boolean! }
`
