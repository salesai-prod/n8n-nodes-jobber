import {
	resourceProperty,
	customerOperations,
	jobOperations,
	scheduleOperations,
	customerFields,
	jobFields,
	scheduleFields,
} from '../nodes/Jobber/JobberDescription';

describe('Resource property', () => {
	test('has correct resource options', () => {
		const values = (resourceProperty.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toEqual(['customer', 'job', 'schedule']);
	});

	test('defaults to customer', () => {
		expect(resourceProperty.default).toBe('customer');
	});
});

describe('Operation selectors', () => {
	test('customer operations include get, search, create', () => {
		const values = (customerOperations.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toContain('get');
		expect(values).toContain('search');
		expect(values).toContain('create');
	});

	test('job operations include get, create', () => {
		const values = (jobOperations.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toContain('get');
		expect(values).toContain('create');
	});

	test('schedule operations include getAvailability', () => {
		const values = (scheduleOperations.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toContain('getAvailability');
	});

	test('each operation has an action string', () => {
		const allOps = [customerOperations, jobOperations, scheduleOperations];
		for (const opGroup of allOps) {
			for (const op of opGroup.options as Array<{ action?: string }>) {
				expect(op.action).toBeDefined();
				expect(typeof op.action).toBe('string');
			}
		}
	});

	test('operations are scoped to correct resource', () => {
		expect(customerOperations.displayOptions?.show?.resource).toEqual(['customer']);
		expect(jobOperations.displayOptions?.show?.resource).toEqual(['job']);
		expect(scheduleOperations.displayOptions?.show?.resource).toEqual(['schedule']);
	});
});

describe('Customer fields', () => {
	test('customerId is required for get', () => {
		const field = customerFields.find((f) => f.name === 'customerId');
		expect(field).toBeDefined();
		expect(field!.required).toBe(true);
		expect(field!.displayOptions?.show?.operation).toEqual(['get']);
	});

	test('searchTerm is required for search', () => {
		const field = customerFields.find((f) => f.name === 'searchTerm');
		expect(field).toBeDefined();
		expect(field!.required).toBe(true);
		expect(field!.displayOptions?.show?.operation).toEqual(['search']);
	});

	test('limit has min 1 and max 100', () => {
		const field = customerFields.find((f) => f.name === 'limit');
		expect(field).toBeDefined();
		expect(field!.typeOptions?.minValue).toBe(1);
		expect(field!.typeOptions?.maxValue).toBe(100);
		expect(field!.default).toBe(25);
	});

	test('create requires firstName and lastName', () => {
		const firstName = customerFields.find((f) => f.name === 'firstName');
		const lastName = customerFields.find((f) => f.name === 'lastName');
		expect(firstName?.required).toBe(true);
		expect(lastName?.required).toBe(true);
	});

	test('additionalFields collection has address fields', () => {
		const additional = customerFields.find((f) => f.name === 'additionalFields');
		expect(additional?.type).toBe('collection');
		const optionNames = (additional?.options as Array<{ name: string }>).map((o) => o.name);
		expect(optionNames).toContain('street1');
		expect(optionNames).toContain('city');
		expect(optionNames).toContain('province');
		expect(optionNames).toContain('postalCode');
		expect(optionNames).toContain('country');
		expect(optionNames).toContain('email');
		expect(optionNames).toContain('phone');
	});
});

describe('Job fields', () => {
	test('job create requires clientId, title, startAt, endAt', () => {
		const required = jobFields.filter((f) => f.required);
		const names = required.map((f) => f.name);
		expect(names).toContain('clientId');
		expect(names).toContain('title');
		expect(names).toContain('startAt');
		expect(names).toContain('endAt');
	});

	test('startAt and endAt use dateTime type', () => {
		const startAt = jobFields.find((f) => f.name === 'startAt');
		const endAt = jobFields.find((f) => f.name === 'endAt');
		expect(startAt?.type).toBe('dateTime');
		expect(endAt?.type).toBe('dateTime');
	});

	test('line item unit price has 2 decimal precision', () => {
		const additional = jobFields.find((f) => f.name === 'jobAdditionalFields');
		const unitPrice = (additional?.options as Array<{ name: string; typeOptions?: { numberPrecision?: number } }>)
			.find((o) => o.name === 'lineItemUnitPrice');
		expect(unitPrice?.typeOptions?.numberPrecision).toBe(2);
	});
});

describe('Schedule fields', () => {
	test('slotDuration has min 15 minutes', () => {
		const field = scheduleFields.find((f) => f.name === 'slotDuration');
		expect(field?.typeOptions?.minValue).toBe(15);
		expect(field?.default).toBe(60);
	});

	test('working hours have sensible defaults', () => {
		const start = scheduleFields.find((f) => f.name === 'workingHoursStart');
		const end = scheduleFields.find((f) => f.name === 'workingHoursEnd');
		expect(start?.default).toBe(8);
		expect(end?.default).toBe(17);
	});

	test('all schedule fields are scoped to getAvailability', () => {
		for (const field of scheduleFields) {
			expect(field.displayOptions?.show?.operation).toEqual(['getAvailability']);
			expect(field.displayOptions?.show?.resource).toEqual(['schedule']);
		}
	});
});
