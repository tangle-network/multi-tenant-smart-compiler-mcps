const request = require('supertest');
const app = require('../src/app');

describe('Users API', () => {
  let userId;

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.count).toBeGreaterThan(0);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        age: 28
      };

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(userData.name);
      expect(res.body.data.email).toBe(userData.email);
      expect(res.body.data.age).toBe(userData.age);
      expect(res.body.data.id).toBeDefined();

      userId = res.body.data.id;
    });

    it('should not create user with invalid data', async () => {
      const invalidData = {
        name: 'A',
        email: 'invalid-email',
        age: -5
      };

      const res = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should not create user with duplicate email', async () => {
      const userData = {
        name: 'Another User',
        email: 'test@example.com',
        age: 30
      };

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const updateData = {
        name: 'Updated User',
        age: 35
      };

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.age).toBe(updateData.age);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id')
        .send({ name: 'Test' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/non-existent-id')
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is healthy');
    });
  });
});