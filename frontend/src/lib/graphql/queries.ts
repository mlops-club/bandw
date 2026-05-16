import { gql } from "@urql/svelte";

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
  query Runs(
    $projectName: String!
    $entityName: String!
    $first: Int
    $after: String
    $order: String
  ) {
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
            config
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
  query RunDetail(
    $projectName: String!
    $entityName: String!
    $runName: String!
  ) {
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
        files(first: 50) {
          edges {
            node {
              id
              name
              url
              directUrl
              sizeBytes
            }
          }
        }
      }
    }
  }
`;

export const RUN_LOGS_QUERY = gql`
  query RunLogs(
    $projectName: String!
    $entityName: String!
    $runName: String!
    $offset: Int
    $limit: Int
  ) {
    project(name: $projectName, entityName: $entityName) {
      run(name: $runName) {
        logLines(offset: $offset, limit: $limit) {
          totalCount
          edges {
            node {
              lineNum
              content
              stream
            }
          }
        }
      }
    }
  }
`;

export const SAMPLED_HISTORY_QUERY = gql`
  query SampledHistory(
    $projectName: String!
    $entityName: String!
    $runName: String!
    $specs: [JSONString!]!
  ) {
    project(name: $projectName, entityName: $entityName) {
      run(name: $runName) {
        sampledHistory(specs: $specs)
      }
    }
  }
`;

export const ALL_VIEWS_QUERY = gql`
  query AllViews(
    $projectName: String!
    $entityName: String!
    $viewType: String
  ) {
    project(name: $projectName, entityName: $entityName) {
      allViews(viewType: $viewType) {
        edges {
          node {
            id
            name
            displayName
            type
            description
            spec
            createdAt
            updatedAt
          }
        }
      }
    }
  }
`;

export const UPSERT_VIEW_MUTATION = gql`
  mutation UpsertView($input: UpsertViewInput!) {
    upsertView(input: $input) {
      view {
        id
        name
        displayName
        type
        description
        spec
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_VIEW_MUTATION = gql`
  mutation DeleteView($input: DeleteViewInput!) {
    deleteView(input: $input) {
      success
    }
  }
`;

export const DELETE_ARTIFACT_MUTATION = gql`
  mutation DeleteArtifact($input: DeleteArtifactInput!) {
    deleteArtifact(input: $input) {
      artifact {
        id
      }
    }
  }
`;
