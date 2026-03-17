import {
	GRAPHQL_API_URL,
	GRAPHQL_API_VERSION,
	CLIENT_GET,
	CLIENTS_SEARCH,
	CLIENT_CREATE,
	JOB_GET,
	JOB_CREATE,
	JOBS_SCHEDULE,
} from '../nodes/Jobber/JobberGraphql';

describe('JobberGraphql constants', () => {
	test('API URL points to Jobber GraphQL endpoint', () => {
		expect(GRAPHQL_API_URL).toBe('https://api.getjobber.com/api/graphql');
	});

	test('API version is a valid date string', () => {
		expect(GRAPHQL_API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe('GraphQL query structure', () => {
	test.each([
		['CLIENT_GET', CLIENT_GET, 'client(id: $id)'],
		['CLIENTS_SEARCH', CLIENTS_SEARCH, 'clients(first: $first'],
		['CLIENT_CREATE', CLIENT_CREATE, 'clientCreate(input: $input)'],
		['JOB_GET', JOB_GET, 'job(id: $id)'],
		['JOB_CREATE', JOB_CREATE, 'jobCreate(input: $input)'],
		['JOBS_SCHEDULE', JOBS_SCHEDULE, 'jobs(first: $first'],
	])('%s contains expected operation', (_name, query, expectedFragment) => {
		expect(query).toContain(expectedFragment);
	});

	test('mutations include userErrors field', () => {
		expect(CLIENT_CREATE).toContain('userErrors');
		expect(JOB_CREATE).toContain('userErrors');
	});

	test('paginated queries include pageInfo', () => {
		expect(CLIENTS_SEARCH).toContain('pageInfo');
		expect(CLIENTS_SEARCH).toContain('hasNextPage');
		expect(JOBS_SCHEDULE).toContain('pageInfo');
		expect(JOBS_SCHEDULE).toContain('hasNextPage');
	});

	test('CLIENT_GET returns full address and property data', () => {
		expect(CLIENT_GET).toContain('billingAddress');
		expect(CLIENT_GET).toContain('properties');
		expect(CLIENT_GET).toContain('createdAt');
	});

	test('JOB_GET returns visits with assigned users', () => {
		expect(JOB_GET).toContain('visits');
		expect(JOB_GET).toContain('assignedUsers');
		expect(JOB_GET).toContain('lineItems');
	});
});
