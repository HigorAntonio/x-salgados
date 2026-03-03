import { jest } from '@jest/globals';

// Create a mock knex instance
const mockKnex = {
  raw: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
  destroy: jest.fn().mockResolvedValue(undefined),
};

export default mockKnex;
