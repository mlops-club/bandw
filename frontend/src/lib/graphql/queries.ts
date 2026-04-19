import { gql } from '@urql/svelte';

export const PROJECTS_QUERY = gql`
	query Projects($entityName: String!) {
		projects(entityName: $entityName) {
			edges {
				node {
					id
					name
					description
					createdAt
					runCount
					lastRunAt
				}
			}
		}
	}
`;

export const RUNS_QUERY = gql`
	query Runs($projectName: String!, $entityName: String!, $first: Int, $after: String, $order: String) {
		project(name: $projectName, entityName: $entityName) {
			id
			name
			runs(first: $first, after: $after, order: $order) {
				edges {
					node {
						id
						name
						displayName
						state
						createdAt
						updatedAt
						summaryMetrics
						tags
						user {
							username
						}
					}
					cursor
				}
				pageInfo {
					hasNextPage
				}
				totalCount
			}
		}
	}
`;

export const RUN_DETAIL_QUERY = gql`
	query RunDetail($projectName: String!, $entityName: String!, $runName: String!) {
		project(name: $projectName, entityName: $entityName) {
			run(name: $runName) {
				id
				name
				displayName
				description
				notes
				state
				config
				summaryMetrics
				tags
				group
				jobType
				commit
				host
				createdAt
				updatedAt
				heartbeatAt
				historyLineCount
				historyKeys
				user {
					username
				}
			}
		}
	}
`;

export const SAMPLED_HISTORY_QUERY = gql`
	query SampledHistory($projectName: String!, $entityName: String!, $runName: String!, $specs: [JSONString!]!) {
		project(name: $projectName, entityName: $entityName) {
			run(name: $runName) {
				sampledHistory(specs: $specs)
			}
		}
	}
`;
