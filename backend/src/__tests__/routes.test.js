import { describe, it, expect, jest, beforeAll, afterEach } from '@jest/globals';
import request from 'supertest';

// Mock the database module before importing app
const mockKnex = {
  raw: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
  destroy: jest.fn(),
};

jest.unstable_mockModule('../db.js', () => ({
  default: mockKnex,
}));

// Import app after mocking
const { default: app } = await import('../app.js');

describe('API Endpoints', () => {
  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
    // Reset to default successful response
    mockKnex.raw.mockResolvedValue({ rows: [{ '?column?': 1 }] });
  });

  describe('GET /status', () => {
    it('should return status ok when database is connected', async () => {
      const response = await request(app)
        .get('/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return 500 when database connection fails', async () => {
      // Mock database error for this test
      mockKnex.raw.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/status')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Database connection failed');
      expect(mockKnex.raw).toHaveBeenCalledWith('SELECT 1');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/rota-inexistente')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/rota-inexistente');
    });

    it('should return 404 for non-existent POST routes', async () => {
      const response = await request(app)
        .post('/api/nao-existe')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/api/nao-existe');
    });
  });

  describe('Error Handler', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockKnex.raw.mockRejectedValueOnce(new Error('Unexpected database error'));

      const response = await request(app)
        .get('/status')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Database connection failed');
    });
  });
});
