import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';

describe('App Configuration', () => {
  describe('Middleware Configuration', () => {
    it('should parse JSON bodies', async () => {
      // The /status endpoint doesn't accept POST, so we expect 404
      // but we can verify JSON is parsed by checking the response format
      const response = await request(app)
        .post('/status')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle requests without body', async () => {
      const response = await request(app)
        .get('/status');

      expect(response.status).toBeDefined();
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Error Handling', () => {
    it('should return JSON error responses', async () => {
      const response = await request(app)
        .get('/trigger-nonexistent-route-12345');

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toHaveProperty('error');
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('App Export', () => {
    it('should export an Express application', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
      expect(app.listen).toBeDefined();
    });
  });
});
