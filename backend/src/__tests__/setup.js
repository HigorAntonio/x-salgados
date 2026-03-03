import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/x_salgados_test';

// Suppress console.log during tests (optional, can be commented out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
// };
