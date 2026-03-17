import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	resourceProperty,
	customerOperations,
	jobOperations,
	scheduleOperations,
	customerFields,
	jobFields,
	scheduleFields,
} from './JobberDescription';

import {
	GRAPHQL_API_URL,
	GRAPHQL_API_VERSION,
	CLIENT_GET,
	CLIENTS_SEARCH,
	CLIENT_CREATE,
	JOB_GET,
	JOB_CREATE,
	JOBS_SCHEDULE,
} from './JobberGraphql';

const MAX_PAGINATION_PAGES = 50;

export class Jobber implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jobber',
		name: 'jobber',
		icon: 'file:jobber.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Jobber field service management API',
		defaults: {
			name: 'Jobber',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'jobberOAuth2Api',
				required: true,
			},
		],
		properties: [
			resourceProperty,
			customerOperations,
			jobOperations,
			scheduleOperations,
			...customerFields,
			...jobFields,
			...scheduleFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: unknown;

				// ─── Customer ────────────────────────────────────────────────
				if (resource === 'customer') {
					if (operation === 'get') {
						const customerId = this.getNodeParameter('customerId', i) as string;
						const result = await jobberGraphqlRequest.call(this, CLIENT_GET, {
							id: customerId,
						});
						responseData = (result as { client: unknown }).client;
					} else if (operation === 'search') {
						const searchTerm = this.getNodeParameter('searchTerm', i) as string;
						const limit = this.getNodeParameter('limit', i) as number;
						const result = await jobberGraphqlRequest.call(this, CLIENTS_SEARCH, {
							first: limit,
							searchTerm,
						});
						responseData = (result as { clients: { nodes: unknown[] } }).clients.nodes;
					} else if (operation === 'create') {
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							companyName?: string;
							email?: string;
							phone?: string;
							street1?: string;
							street2?: string;
							city?: string;
							province?: string;
							postalCode?: string;
							country?: string;
						};

						const input: Record<string, unknown> = { firstName, lastName };

						if (additionalFields.companyName) {
							input.companyName = additionalFields.companyName;
						}

						if (additionalFields.email) {
							input.emails = [
								{
									description: 'MAIN',
									primary: true,
									address: additionalFields.email,
								},
							];
						}

						if (additionalFields.phone) {
							input.phones = [
								{
									description: 'MAIN',
									primary: true,
									number: additionalFields.phone,
								},
							];
						}

						const hasAddress =
							additionalFields.street1 ||
							additionalFields.city ||
							additionalFields.province ||
							additionalFields.postalCode;

						if (hasAddress) {
							input.billingAddress = {
								street1: additionalFields.street1 || '',
								street2: additionalFields.street2 || '',
								city: additionalFields.city || '',
								province: additionalFields.province || '',
								postalCode: additionalFields.postalCode || '',
								country: additionalFields.country || '',
							};
						}

						const result = await jobberGraphqlRequest.call(this, CLIENT_CREATE, {
							input,
						});

						const createResult = result as {
							clientCreate: {
								client: unknown;
								userErrors: Array<{ message: string; path: string[] }>;
							};
						};

						if (createResult.clientCreate.userErrors?.length > 0) {
							throw new NodeOperationError(
								this.getNode(),
								`Jobber: ${createResult.clientCreate.userErrors.map((e) => e.message).join(', ')}`,
								{ itemIndex: i },
							);
						}

						responseData = createResult.clientCreate.client;
					}
				// ─── Job ─────────────────────────────────────────────────────
				} else if (resource === 'job') {
					if (operation === 'get') {
						const jobId = this.getNodeParameter('jobId', i) as string;
						const result = await jobberGraphqlRequest.call(this, JOB_GET, {
							id: jobId,
						});
						responseData = (result as { job: unknown }).job;
					} else if (operation === 'create') {
						const clientId = this.getNodeParameter('clientId', i) as string;
						const title = this.getNodeParameter('title', i) as string;
						const startAt = this.getNodeParameter('startAt', i) as string;
						const endAt = this.getNodeParameter('endAt', i) as string;
						const additionalFields = this.getNodeParameter('jobAdditionalFields', i) as {
							instructions?: string;
							lineItemName?: string;
							lineItemDescription?: string;
							lineItemQuantity?: number;
							lineItemUnitPrice?: number;
						};

						const input: Record<string, unknown> = {
							clientId,
							title,
							startAt,
							endAt,
						};

						if (additionalFields.instructions) {
							input.instructions = additionalFields.instructions;
						}

						if (additionalFields.lineItemName) {
							input.lineItems = [
								{
									name: additionalFields.lineItemName,
									description: additionalFields.lineItemDescription || '',
									quantity: additionalFields.lineItemQuantity ?? 1,
									unitPrice: additionalFields.lineItemUnitPrice ?? 0,
								},
							];
						}

						const result = await jobberGraphqlRequest.call(this, JOB_CREATE, {
							input,
						});

						const createResult = result as {
							jobCreate: {
								job: unknown;
								userErrors: Array<{ message: string; path: string[] }>;
							};
						};

						if (createResult.jobCreate.userErrors?.length > 0) {
							throw new NodeOperationError(
								this.getNode(),
								`Jobber: ${createResult.jobCreate.userErrors.map((e) => e.message).join(', ')}`,
								{ itemIndex: i },
							);
						}

						responseData = createResult.jobCreate.job;
					}
				// ─── Schedule ────────────────────────────────────────────────
				} else if (resource === 'schedule') {
					if (operation === 'getAvailability') {
						const scheduleStartDate = this.getNodeParameter('scheduleStartDate', i) as string;
						const scheduleEndDate = this.getNodeParameter('scheduleEndDate', i) as string;
						const slotDuration = this.getNodeParameter('slotDuration', i) as number;
						const workingHoursStart = this.getNodeParameter('workingHoursStart', i) as number;
						const workingHoursEnd = this.getNodeParameter('workingHoursEnd', i) as number;

						if (workingHoursStart >= workingHoursEnd) {
							throw new NodeOperationError(
								this.getNode(),
								`Working hours start (${workingHoursStart}) must be less than end (${workingHoursEnd})`,
								{ itemIndex: i },
							);
						}

						// Fetch all jobs in the date range
						const bookedSlots = await fetchAllJobsInRange.call(
							this,
							scheduleStartDate,
							scheduleEndDate,
						);

						// Compute open slots
						const openSlots = computeAvailability(
							scheduleStartDate,
							scheduleEndDate,
							bookedSlots,
							slotDuration,
							workingHoursStart,
							workingHoursEnd,
						);

						responseData = openSlots;
					}
				}

				// Normalize output
				if (Array.isArray(responseData)) {
					returnData.push(
						...responseData.map((item) => ({
							json: item as IDataObject,
							pairedItem: { item: i },
						})),
					);
				} else if (responseData) {
					returnData.push({
						json: responseData as IDataObject,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function jobberGraphqlRequest(
	this: IExecuteFunctions,
	query: string,
	variables: Record<string, unknown> = {},
): Promise<unknown> {
	const options: IRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		uri: GRAPHQL_API_URL,
		headers: {
			'Content-Type': 'application/json',
			'X-JOBBER-GRAPHQL-VERSION': GRAPHQL_API_VERSION,
		},
		body: {
			query,
			variables,
		},
		json: true,
	};

	const response = await this.helpers.requestOAuth2.call(this, 'jobberOAuth2Api', options);

	if (response.errors && response.errors.length > 0) {
		throw new NodeApiError(this.getNode(), response as JsonObject, {
			message: response.errors[0].message,
		});
	}

	return response.data;
}

interface BookedSlot {
	startAt: string;
	endAt: string;
}

async function fetchAllJobsInRange(
	this: IExecuteFunctions,
	startDate: string,
	endDate: string,
): Promise<BookedSlot[]> {
	const bookedSlots: BookedSlot[] = [];
	let hasNextPage = true;
	let cursor: string | undefined;
	let pageCount = 0;

	while (hasNextPage && pageCount < MAX_PAGINATION_PAGES) {
		pageCount++;

		const variables: Record<string, unknown> = {
			first: 100,
			filter: {
				startAt: startDate,
				endAt: endDate,
			},
		};
		if (cursor) {
			variables.after = cursor;
		}

		const result = (await jobberGraphqlRequest.call(this, JOBS_SCHEDULE, variables)) as {
			jobs: {
				nodes: Array<{
					startAt: string;
					endAt: string;
					visits: {
						nodes: Array<{
							startAt: string;
							endAt: string;
						}>;
					};
				}>;
				pageInfo: {
					endCursor: string;
					hasNextPage: boolean;
				};
			};
		};

		for (const job of result.jobs.nodes) {
			// Use visit times if available (more granular), otherwise job times
			if (job.visits?.nodes?.length > 0) {
				for (const visit of job.visits.nodes) {
					if (visit.startAt && visit.endAt) {
						bookedSlots.push({ startAt: visit.startAt, endAt: visit.endAt });
					}
				}
			} else if (job.startAt && job.endAt) {
				bookedSlots.push({ startAt: job.startAt, endAt: job.endAt });
			}
		}

		hasNextPage = result.jobs.pageInfo.hasNextPage;
		cursor = result.jobs.pageInfo.endCursor;
	}

	return bookedSlots;
}

interface AvailableSlot {
	date: string;
	startTime: string;
	endTime: string;
	startAt: string;
	endAt: string;
}

function computeAvailability(
	startDate: string,
	endDate: string,
	bookedSlots: BookedSlot[],
	slotDurationMinutes: number,
	workingHoursStart: number,
	workingHoursEnd: number,
): AvailableSlot[] {
	const openSlots: AvailableSlot[] = [];
	const start = new Date(startDate);
	const end = new Date(endDate);

	// Iterate day by day in UTC
	const current = new Date(start);
	current.setUTCHours(0, 0, 0, 0);

	while (current <= end) {
		const dayOfWeek = current.getUTCDay();
		// Skip weekends (0 = Sunday, 6 = Saturday)
		if (dayOfWeek === 0 || dayOfWeek === 6) {
			current.setUTCDate(current.getUTCDate() + 1);
			continue;
		}

		// Generate candidate slots for this day
		const dayStart = new Date(current);
		dayStart.setUTCHours(workingHoursStart, 0, 0, 0);

		const dayEnd = new Date(current);
		dayEnd.setUTCHours(workingHoursEnd, 0, 0, 0);

		const slotStart = new Date(dayStart);

		while (slotStart.getTime() + slotDurationMinutes * 60_000 <= dayEnd.getTime()) {
			const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60_000);

			// Check if this slot overlaps with any booked slot
			const isBooked = bookedSlots.some((booked) => {
				const bookedStart = new Date(booked.startAt).getTime();
				const bookedEnd = new Date(booked.endAt).getTime();
				return slotStart.getTime() < bookedEnd && slotEnd.getTime() > bookedStart;
			});

			if (!isBooked) {
				const dateStr = current.toISOString().split('T')[0];
				const startHH = String(slotStart.getUTCHours()).padStart(2, '0');
				const startMM = String(slotStart.getUTCMinutes()).padStart(2, '0');
				const endHH = String(slotEnd.getUTCHours()).padStart(2, '0');
				const endMM = String(slotEnd.getUTCMinutes()).padStart(2, '0');
				openSlots.push({
					date: dateStr,
					startTime: `${startHH}:${startMM}`,
					endTime: `${endHH}:${endMM}`,
					startAt: slotStart.toISOString(),
					endAt: slotEnd.toISOString(),
				});
			}

			slotStart.setTime(slotStart.getTime() + slotDurationMinutes * 60_000);
		}

		current.setUTCDate(current.getUTCDate() + 1);
	}

	return openSlots;
}
