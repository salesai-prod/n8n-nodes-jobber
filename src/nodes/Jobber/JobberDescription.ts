import type { INodeProperties } from 'n8n-workflow';

// ─── Resource selector ───────────────────────────────────────────────────────

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Customer', value: 'customer' },
		{ name: 'Job', value: 'job' },
		{ name: 'Schedule', value: 'schedule' },
	],
	default: 'customer',
};

// ─── Operation selectors ─────────────────────────────────────────────────────

export const customerOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: { resource: ['customer'] },
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new customer',
			action: 'Create a customer',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Retrieve a customer by ID',
			action: 'Get a customer',
		},
		{
			name: 'Search',
			value: 'search',
			description: 'Search for customers',
			action: 'Search customers',
		},
	],
	default: 'get',
};

export const jobOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: { resource: ['job'] },
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new job',
			action: 'Create a job',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Retrieve a job by ID',
			action: 'Get a job',
		},
	],
	default: 'get',
};

export const scheduleOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: { resource: ['schedule'] },
	},
	options: [
		{
			name: 'Get Availability',
			value: 'getAvailability',
			description: 'Find open time slots in a date range',
			action: 'Get schedule availability',
		},
	],
	default: 'getAvailability',
};

// ─── Customer fields ─────────────────────────────────────────────────────────

export const customerFields: INodeProperties[] = [
	// GET
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['customer'], operation: ['get'] },
		},
		description: 'The ID of the customer to retrieve',
	},

	// SEARCH
	{
		displayName: 'Search Term',
		name: 'searchTerm',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['customer'], operation: ['search'] },
		},
		description: 'Name, email, or phone to search for',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		default: 25,
		displayOptions: {
			show: { resource: ['customer'], operation: ['search'] },
		},
		description: 'Max number of results to return',
	},

	// CREATE
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['customer'], operation: ['create'] },
		},
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['customer'], operation: ['create'] },
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['customer'], operation: ['create'] },
		},
		options: [
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Street Address',
				name: 'street1',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Street Address 2',
				name: 'street2',
				type: 'string',
				default: '',
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Province / State',
				name: 'province',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Postal Code',
				name: 'postalCode',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
			},
		],
	},
];

// ─── Job fields ──────────────────────────────────────────────────────────────

export const jobFields: INodeProperties[] = [
	// GET
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['job'], operation: ['get'] },
		},
		description: 'The ID of the job to retrieve',
	},

	// CREATE
	{
		displayName: 'Customer ID',
		name: 'clientId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['job'], operation: ['create'] },
		},
		description: 'The ID of the customer this job is for',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['job'], operation: ['create'] },
		},
		description: 'The title/name of the job',
	},
	{
		displayName: 'Start Date',
		name: 'startAt',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['job'], operation: ['create'] },
		},
		description: 'When the job starts (ISO 8601)',
	},
	{
		displayName: 'End Date',
		name: 'endAt',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['job'], operation: ['create'] },
		},
		description: 'When the job ends (ISO 8601)',
	},
	{
		displayName: 'Additional Fields',
		name: 'jobAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['job'], operation: ['create'] },
		},
		options: [
			{
				displayName: 'Instructions',
				name: 'instructions',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Instructions or notes for the job',
			},
			{
				displayName: 'Line Item Name',
				name: 'lineItemName',
				type: 'string',
				default: '',
				description: 'Name of a line item to add',
			},
			{
				displayName: 'Line Item Description',
				name: 'lineItemDescription',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Line Item Quantity',
				name: 'lineItemQuantity',
				type: 'number',
				default: 1,
			},
			{
				displayName: 'Line Item Unit Price',
				name: 'lineItemUnitPrice',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				description: 'Price per unit in dollars',
			},
		],
	},
];

// ─── Schedule fields ─────────────────────────────────────────────────────────

export const scheduleFields: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'scheduleStartDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['schedule'], operation: ['getAvailability'] },
		},
		description: 'Start of the date range to check',
	},
	{
		displayName: 'End Date',
		name: 'scheduleEndDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['schedule'], operation: ['getAvailability'] },
		},
		description: 'End of the date range to check',
	},
	{
		displayName: 'Slot Duration (Minutes)',
		name: 'slotDuration',
		type: 'number',
		typeOptions: { minValue: 15 },
		default: 60,
		displayOptions: {
			show: { resource: ['schedule'], operation: ['getAvailability'] },
		},
		description: 'Duration of each availability slot in minutes',
	},
	{
		displayName: 'Working Hours Start',
		name: 'workingHoursStart',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 23 },
		default: 8,
		displayOptions: {
			show: { resource: ['schedule'], operation: ['getAvailability'] },
		},
		description: 'Start of working day (hour in 24h format, e.g. 8 = 8:00 AM)',
	},
	{
		displayName: 'Working Hours End',
		name: 'workingHoursEnd',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 24 },
		default: 17,
		displayOptions: {
			show: { resource: ['schedule'], operation: ['getAvailability'] },
		},
		description: 'End of working day (hour in 24h format, e.g. 17 = 5:00 PM)',
	},
];
