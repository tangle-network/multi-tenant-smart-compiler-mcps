const request = require('supertest');
const app = require('../src/app');

describe('App', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await request(app).get('/');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome to Node.js REST API');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.endpoints).toHaveProperty('users');
    });
  });

  describe('GET /health', () => {
    it('should return health check', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('404 Handler', () => {
    it('should handle non-existent routes', async () => {
      const res = await request(app).get('/non-existent');
      
      expect(res.status).toBe(404);
    });
  });
});