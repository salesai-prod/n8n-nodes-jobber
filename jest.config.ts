import type { Config } from 'jest';

// Force UTC so schedule/availability tests are deterministic
process.env.TZ = 'UTC';

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.test.ts'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
	],
	coverageDirectory: 'coverage',
};

export default config;
