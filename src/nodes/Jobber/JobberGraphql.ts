/**
 * GraphQL queries and mutations for the Jobber API.
 */

export const GRAPHQL_API_URL = 'https://api.getjobber.com/api/graphql';
export const GRAPHQL_API_VERSION = '2025-01-20';

// ─── Customer (Client) Queries ───────────────────────────────────────────────

export const CLIENT_GET = `
query ClientGet($id: EncodedId!) {
  client(id: $id) {
    id
    firstName
    lastName
    companyName
    isCompany
    emails {
      address
      description
      primary
    }
    phones {
      number
      description
      primary
    }
    billingAddress {
      street1
      street2
      city
      province
      postalCode
      country
    }
    properties {
      nodes {
        id
        address {
          street1
          street2
          city
          province
          postalCode
          country
        }
      }
    }
    createdAt
    updatedAt
  }
}
`;

export const CLIENTS_SEARCH = `
query ClientsSearch($first: Int, $after: String, $searchTerm: String) {
  clients(first: $first, after: $after, searchTerm: $searchTerm) {
    nodes {
      id
      firstName
      lastName
      companyName
      isCompany
      emails {
        address
        description
        primary
      }
      phones {
        number
        description
        primary
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
    totalCount
  }
}
`;

export const CLIENT_CREATE = `
mutation ClientCreate($input: ClientCreateInput!) {
  clientCreate(input: $input) {
    client {
      id
      firstName
      lastName
      companyName
      isCompany
      emails {
        address
        description
        primary
      }
      phones {
        number
        description
        primary
      }
    }
    userErrors {
      message
      path
    }
  }
}
`;

// ─── Job Queries ─────────────────────────────────────────────────────────────

export const JOB_GET = `
query JobGet($id: EncodedId!) {
  job(id: $id) {
    id
    jobNumber
    title
    instructions
    jobStatus
    startAt
    endAt
    client {
      id
      firstName
      lastName
      companyName
    }
    property {
      id
      address {
        street1
        street2
        city
        province
        postalCode
        country
      }
    }
    lineItems {
      nodes {
        id
        name
        description
        quantity
        unitPrice
      }
    }
    visits {
      nodes {
        id
        title
        startAt
        endAt
        isComplete
        assignedUsers {
          nodes {
            id
            name {
              full
            }
          }
        }
      }
    }
    createdAt
    updatedAt
  }
}
`;

export const JOB_CREATE = `
mutation JobCreate($input: JobCreateInput!) {
  jobCreate(input: $input) {
    job {
      id
      jobNumber
      title
      jobStatus
      startAt
      endAt
      client {
        id
        firstName
        lastName
      }
    }
    userErrors {
      message
      path
    }
  }
}
`;

// ─── Schedule Queries ────────────────────────────────────────────────────────

export const JOBS_SCHEDULE = `
query JobsSchedule($first: Int, $after: String, $filter: JobFilterAttributes) {
  jobs(first: $first, after: $after, filter: $filter) {
    nodes {
      id
      jobNumber
      title
      startAt
      endAt
      visits {
        nodes {
          id
          startAt
          endAt
          isComplete
          assignedUsers {
            nodes {
              id
              name {
                full
              }
            }
          }
        }
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
`;
