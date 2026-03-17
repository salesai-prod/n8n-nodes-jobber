import type {
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { Jobber } from '../nodes/Jobber/Jobber.node';

// ─── Mock helpers ────────────────────────────────────────────────────────────

function createMockExecuteFunctions(overrides: {
	resource: string;
	operation: string;
	params?: Record<string, unknown>;
	oauthResponse?: unknown;
	continueOnFail?: boolean;
}): IExecuteFunctions {
	const { resource, operation, params = {}, oauthResponse, continueOnFail = false } = overrides;

	const paramMap: Record<string, unknown> = {
		resource,
		operation,
		...params,
	};

	return {
		getInputData: () => [{ json: {} }],
		getNodeParameter: ((name: string, _itemIndex: number) => {
			if (paramMap[name] === undefined) {
				throw new Error(`Unexpected parameter requested: ${name}`);
			}
			return paramMap[name];
		}) as IExecuteFunctions['getNodeParameter'],
		getNode: () => ({ name: 'Jobber', type: 'n8n-nodes-jobber.jobber', typeVersion: 1, position: [0, 0], parameters: {} }),
		helpers: {
			requestOAuth2: jest.fn().mockResolvedValue(oauthResponse),
		} as unknown as IExecuteFunctions['helpers'],
		continueOnFail: () => continueOnFail,
	} as unknown as IExecuteFunctions;
}

// ─── Node description ────────────────────────────────────────────────────────

describe('Jobber node description', () => {
	const node = new Jobber();

	test('has correct metadata', () => {
		expect(node.description.name).toBe('jobber');
		expect(node.description.displayName).toBe('Jobber');
		expect(node.description.version).toBe(1);
	});

	test('requires OAuth2 credentials', () => {
		expect(node.description.credentials).toEqual([
			{ name: 'jobberOAuth2Api', required: true },
		]);
	});

	test('has main input and output', () => {
		expect(node.description.inputs).toEqual(['main']);
		expect(node.description.outputs).toEqual(['main']);
	});
});

// ─── Customer operations ─────────────────────────────────────────────────────

describe('Customer: Get', () => {
	test('returns customer data by ID', async () => {
		const mockClient = {
			id: 'abc123',
			firstName: 'John',
			lastName: 'Doe',
			emails: [{ address: 'john@example.com', primary: true }],
		};

		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'get',
			params: { customerId: 'abc123' },
			oauthResponse: {
				data: { client: mockClient },
			},
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual(mockClient);
		expect(result[0][0].pairedItem).toEqual({ item: 0 });
	});

	test('throws on GraphQL errors', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'get',
			params: { customerId: 'bad-id' },
			oauthResponse: {
				errors: [{ message: 'Client not found' }],
			},
		});

		const node = new Jobber();
		await expect(node.execute.call(mockContext)).rejects.toThrow();
	});

	test('returns error json when continueOnFail is true', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'get',
			params: { customerId: 'bad-id' },
			oauthResponse: {
				errors: [{ message: 'Client not found' }],
			},
			continueOnFail: true,
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toHaveProperty('error');
	});
});

describe('Customer: Search', () => {
	test('returns array of matching customers', async () => {
		const mockClients = [
			{ id: '1', firstName: 'John', lastName: 'Doe' },
			{ id: '2', firstName: 'Jane', lastName: 'Doe' },
		];

		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'search',
			params: { searchTerm: 'Doe', limit: 25 },
			oauthResponse: {
				data: {
					clients: {
						nodes: mockClients,
						pageInfo: { endCursor: null, hasNextPage: false },
						totalCount: 2,
					},
				},
			},
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0]).toHaveLength(2);
		expect(result[0][0].json).toEqual(mockClients[0]);
		expect(result[0][1].json).toEqual(mockClients[1]);
	});

	test('returns empty array when no results', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'search',
			params: { searchTerm: 'Nonexistent', limit: 25 },
			oauthResponse: {
				data: {
					clients: {
						nodes: [],
						pageInfo: { endCursor: null, hasNextPage: false },
						totalCount: 0,
					},
				},
			},
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0]).toHaveLength(0);
	});
});

describe('Customer: Create', () => {
	test('creates customer with required fields only', async () => {
		const mockCreated = { id: 'new-123', firstName: 'Alice', lastName: 'Smith' };

		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'create',
			params: {
				firstName: 'Alice',
				lastName: 'Smith',
				additionalFields: {},
			},
			oauthResponse: {
				data: {
					clientCreate: {
						client: mockCreated,
						userErrors: [],
					},
				},
			},
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0][0].json).toEqual(mockCreated);

		const requestCall = (mockContext.helpers.requestOAuth2 as jest.Mock).mock.calls[0];
		const body = requestCall[1].body;
		expect(body.variables.input).toEqual({ firstName: 'Alice', lastName: 'Smith' });
	});

	test('includes email, phone, and address when provided', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'create',
			params: {
				firstName: 'Bob',
				lastName: 'Jones',
				additionalFields: {
					companyName: 'Acme',
					email: 'bob@acme.com',
					phone: '555-1234',
					street1: '123 Main St',
					city: 'Springfield',
					province: 'IL',
					postalCode: '62701',
					country: 'US',
				},
			},
			oauthResponse: {
				data: {
					clientCreate: {
						client: { id: 'new-456' },
						userErrors: [],
					},
				},
			},
		});

		const node = new Jobber();
		await node.execute.call(mockContext);

		const requestCall = (mockContext.helpers.requestOAuth2 as jest.Mock).mock.calls[0];
		const input = requestCall[1].body.variables.input;

		expect(input.companyName).toBe('Acme');
		expect(input.emails).toEqual([{ description: 'MAIN', primary: true, address: 'bob@acme.com' }]);
		expect(input.phones).toEqual([{ description: 'MAIN', primary: true, number: '555-1234' }]);
		expect(input.billingAddress).toEqual({
			street1: '123 Main St',
			street2: '',
			city: 'Springfield',
			province: 'IL',
			postalCode: '62701',
			country: 'US',
		});
	});

	test('throws on userErrors from Jobber API', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'create',
			params: {
				firstName: '',
				lastName: '',
				additionalFields: {},
			},
			oauthResponse: {
				data: {
					clientCreate: {
						client: null,
						userErrors: [
							{ message: 'First name is required', path: ['firstName'] },
						],
					},
				},
			},
		});

		const node = new Jobber();
		await expect(node.execute.call(mockContext)).rejects.toThrow('First name is required');
	});
});

// ─── Job operations ──────────────────────────────────────────────────────────

describe('Job: Get', () => {
	test('returns job data by ID', async () => {
		const mockJob = {
			id: 'job-1',
			jobNumber: 42,
			title: 'Lawn Service',
			jobStatus: 'active',
		};

		const mockContext = createMockExecuteFunctions({
			resource: 'job',
			operation: 'get',
			params: { jobId: 'job-1' },
			oauthResponse: { data: { job: mockJob } },
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0][0].json).toEqual(mockJob);
	});
});

describe('Job: Create', () => {
	test('creates job with required fields', async () => {
		const mockJob = { id: 'job-new', title: 'Plumbing Repair' };

		const mockContext = createMockExecuteFunctions({
			resource: 'job',
			operation: 'create',
			params: {
				clientId: 'client-1',
				title: 'Plumbing Repair',
				startAt: '2025-06-01T09:00:00Z',
				endAt: '2025-06-01T11:00:00Z',
				jobAdditionalFields: {},
			},
			oauthResponse: {
				data: {
					jobCreate: {
						job: mockJob,
						userErrors: [],
					},
				},
			},
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0][0].json).toEqual(mockJob);
	});

	test('includes line items and instructions', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'job',
			operation: 'create',
			params: {
				clientId: 'client-1',
				title: 'HVAC Install',
				startAt: '2025-06-01T09:00:00Z',
				endAt: '2025-06-01T17:00:00Z',
				jobAdditionalFields: {
					instructions: 'Ring doorbell twice',
					lineItemName: 'AC Unit',
					lineItemDescription: '3-ton unit',
					lineItemQuantity: 1,
					lineItemUnitPrice: 2500.00,
				},
			},
			oauthResponse: {
				data: {
					jobCreate: {
						job: { id: 'job-hvac' },
						userErrors: [],
					},
				},
			},
		});

		const node = new Jobber();
		await node.execute.call(mockContext);

		const requestCall = (mockContext.helpers.requestOAuth2 as jest.Mock).mock.calls[0];
		const input = requestCall[1].body.variables.input;

		expect(input.instructions).toBe('Ring doorbell twice');
		expect(input.lineItems).toEqual([{
			name: 'AC Unit',
			description: '3-ton unit',
			quantity: 1,
			unitPrice: 2500.00,
		}]);
	});

	test('throws on job creation userErrors', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'job',
			operation: 'create',
			params: {
				clientId: 'bad-client',
				title: 'Test',
				startAt: '2025-06-01T09:00:00Z',
				endAt: '2025-06-01T11:00:00Z',
				jobAdditionalFields: {},
			},
			oauthResponse: {
				data: {
					jobCreate: {
						job: null,
						userErrors: [{ message: 'Client not found', path: ['clientId'] }],
					},
				},
			},
		});

		const node = new Jobber();
		await expect(node.execute.call(mockContext)).rejects.toThrow('Client not found');
	});
});

// ─── Schedule: computeAvailability (tested via node execution) ───────────────

describe('Schedule: Get Availability', () => {
	function createScheduleContext(
		oauthResponse: unknown,
		overrides: Partial<{
			scheduleStartDate: string;
			scheduleEndDate: string;
			slotDuration: number;
			workingHoursStart: number;
			workingHoursEnd: number;
		}> = {},
	) {
		return createMockExecuteFunctions({
			resource: 'schedule',
			operation: 'getAvailability',
			params: {
				scheduleStartDate: '2025-06-02T00:00:00Z',  // Monday
				scheduleEndDate: '2025-06-02T23:59:59Z',     // Same Monday
				slotDuration: 60,
				workingHoursStart: 8,
				workingHoursEnd: 17,
				...overrides,
			},
			oauthResponse,
		});
	}

	const emptyJobsResponse = {
		data: {
			jobs: {
				nodes: [],
				pageInfo: { endCursor: null, hasNextPage: false },
			},
		},
	};

	test('returns all slots for an empty day', async () => {
		const mockContext = createScheduleContext(emptyJobsResponse);
		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		// 8:00-17:00 with 60min slots = 9 slots
		expect(result[0]).toHaveLength(9);
		expect(result[0][0].json).toMatchObject({
			startTime: '08:00',
			endTime: '09:00',
		});
		expect(result[0][8].json).toMatchObject({
			startTime: '16:00',
			endTime: '17:00',
		});
	});

	test('excludes slots that conflict with booked jobs', async () => {
		const bookedResponse = {
			data: {
				jobs: {
					nodes: [
						{
							id: 'j1',
							startAt: '2025-06-02T10:00:00.000Z',
							endAt: '2025-06-02T12:00:00.000Z',
							visits: { nodes: [] },
						},
					],
					pageInfo: { endCursor: null, hasNextPage: false },
				},
			},
		};

		const mockContext = createScheduleContext(bookedResponse);
		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		// 9 total slots minus 2 booked (10:00-11:00, 11:00-12:00) = 7
		expect(result[0]).toHaveLength(7);

		const times = result[0].map((item) => (item.json as { startTime: string }).startTime);
		expect(times).not.toContain('10:00');
		expect(times).not.toContain('11:00');
		expect(times).toContain('08:00');
		expect(times).toContain('12:00');
	});

	test('uses visit times when available instead of job times', async () => {
		const visitResponse = {
			data: {
				jobs: {
					nodes: [
						{
							id: 'j1',
							startAt: '2025-06-02T08:00:00.000Z',
							endAt: '2025-06-02T17:00:00.000Z',  // whole day
							visits: {
								nodes: [
									{
										startAt: '2025-06-02T09:00:00.000Z',
										endAt: '2025-06-02T10:00:00.000Z',  // only 1 hour
									},
								],
							},
						},
					],
					pageInfo: { endCursor: null, hasNextPage: false },
				},
			},
		};

		const mockContext = createScheduleContext(visitResponse);
		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		// Only the 9:00-10:00 slot should be blocked (visit time), not the whole day
		expect(result[0]).toHaveLength(8);
		const times = result[0].map((item) => (item.json as { startTime: string }).startTime);
		expect(times).not.toContain('09:00');
		expect(times).toContain('08:00');
		expect(times).toContain('10:00');
	});

	test('skips weekends', async () => {
		// 2025-06-07 is Saturday, 2025-06-08 is Sunday
		const mockContext = createScheduleContext(emptyJobsResponse, {
			scheduleStartDate: '2025-06-07T00:00:00Z',
			scheduleEndDate: '2025-06-08T23:59:59Z',
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0]).toHaveLength(0);
	});

	test('respects custom slot duration', async () => {
		const mockContext = createScheduleContext(emptyJobsResponse, {
			slotDuration: 30,
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		// 8:00-17:00 with 30min slots = 18 slots
		expect(result[0]).toHaveLength(18);
	});

	test('respects custom working hours', async () => {
		const mockContext = createScheduleContext(emptyJobsResponse, {
			workingHoursStart: 9,
			workingHoursEnd: 12,
		});

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		// 9:00-12:00 with 60min slots = 3 slots
		expect(result[0]).toHaveLength(3);
	});

	test('handles pagination across multiple pages of jobs', async () => {
		const requestMock = jest.fn()
			.mockResolvedValueOnce({
				data: {
					jobs: {
						nodes: [
							{
								id: 'j1',
								startAt: '2025-06-02T08:00:00.000Z',
								endAt: '2025-06-02T09:00:00.000Z',
								visits: { nodes: [] },
							},
						],
						pageInfo: { endCursor: 'cursor1', hasNextPage: true },
					},
				},
			})
			.mockResolvedValueOnce({
				data: {
					jobs: {
						nodes: [
							{
								id: 'j2',
								startAt: '2025-06-02T14:00:00.000Z',
								endAt: '2025-06-02T15:00:00.000Z',
								visits: { nodes: [] },
							},
						],
						pageInfo: { endCursor: 'cursor2', hasNextPage: false },
					},
				},
			});

		const mockContext = createScheduleContext(null);
		(mockContext.helpers as unknown as { requestOAuth2: jest.Mock }).requestOAuth2 = requestMock;

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		// 9 slots minus 2 booked (08:00 and 14:00) = 7
		expect(result[0]).toHaveLength(7);
		expect(requestMock).toHaveBeenCalledTimes(2);
	});

	test('throws when workingHoursStart >= workingHoursEnd', async () => {
		const mockContext = createScheduleContext(emptyJobsResponse, {
			workingHoursStart: 17,
			workingHoursEnd: 8,
		});

		const node = new Jobber();
		await expect(node.execute.call(mockContext)).rejects.toThrow(
			'Working hours start (17) must be less than end (8)',
		);
	});

	test('throws when workingHoursStart equals workingHoursEnd', async () => {
		const mockContext = createScheduleContext(emptyJobsResponse, {
			workingHoursStart: 9,
			workingHoursEnd: 9,
		});

		const node = new Jobber();
		await expect(node.execute.call(mockContext)).rejects.toThrow(
			'Working hours start (9) must be less than end (9)',
		);
	});

	test('pagination stops at safety limit', async () => {
		// Create a mock that always returns hasNextPage: true
		const requestMock = jest.fn().mockResolvedValue({
			data: {
				jobs: {
					nodes: [],
					pageInfo: { endCursor: 'next', hasNextPage: true },
				},
			},
		});

		const mockContext = createScheduleContext(null);
		(mockContext.helpers as unknown as { requestOAuth2: jest.Mock }).requestOAuth2 = requestMock;

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		// Should stop at MAX_PAGINATION_PAGES (50), not loop forever
		expect(requestMock).toHaveBeenCalledTimes(50);
		expect(result[0]).toHaveLength(9); // all slots open since no jobs returned
	});
});

// ─── Multi-item processing ───────────────────────────────────────────────────

describe('Multi-item execution', () => {
	test('processes multiple input items', async () => {
		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'get',
			params: { customerId: 'abc' },
			oauthResponse: {
				data: { client: { id: 'abc', firstName: 'Test' } },
			},
		});

		// Override getInputData to return 3 items
		mockContext.getInputData = () => [{ json: {} }, { json: {} }, { json: {} }];

		const node = new Jobber();
		const result = await node.execute.call(mockContext);

		expect(result[0]).toHaveLength(3);
		expect(result[0][0].pairedItem).toEqual({ item: 0 });
		expect(result[0][1].pairedItem).toEqual({ item: 1 });
		expect(result[0][2].pairedItem).toEqual({ item: 2 });
	});
});

// ─── GraphQL request helper ──────────────────────────────────────────────────

describe('GraphQL request formatting', () => {
	test('sends correct headers and body structure', async () => {
		const requestMock = jest.fn().mockResolvedValue({
			data: { client: { id: 'test' } },
		});

		const mockContext = createMockExecuteFunctions({
			resource: 'customer',
			operation: 'get',
			params: { customerId: 'test' },
			oauthResponse: null,
		});
		(mockContext.helpers as unknown as { requestOAuth2: jest.Mock }).requestOAuth2 = requestMock;

		const node = new Jobber();
		await node.execute.call(mockContext);

		const callArgs = requestMock.mock.calls[0];
		expect(callArgs[0]).toBe('jobberOAuth2Api');

		const options = callArgs[1];
		expect(options.method).toBe('POST');
		expect(options.uri).toBe('https://api.getjobber.com/api/graphql');
		expect(options.headers['X-JOBBER-GRAPHQL-VERSION']).toBe('2025-01-20');
		expect(options.headers['Content-Type']).toBe('application/json');
		expect(options.body).toHaveProperty('query');
		expect(options.body).toHaveProperty('variables');
		expect(options.json).toBe(true);
	});
});
