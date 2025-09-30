const request = require('supertest');
const app = require('../src/app');

describe('User API Endpoints', () => {
  let createdUserId;

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a user by valid ID', async () => {
      const res = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 1);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('age');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .get('/api/users/invalid')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid user ID');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        age: 28
      };

      const res = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(newUser.name);
      expect(res.body.data.email).toBe(newUser.email);
      expect(res.body.data.age).toBe(newUser.age);

      createdUserId = res.body.data.id;
    });

    it('should return 400 for invalid data', async () => {
      const invalidUser = {
        name: 'A', // Too short
        email: 'invalid-email',
        age: -5 // Invalid age
      };

      const res = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation error');
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUser = {
        name: 'Another User',
        email: 'john@example.com', // Already exists
        age: 30
      };

      const res = await request(app)
        .post('/api/users')
        .send(duplicateUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Email already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteUser = {
        name: 'Incomplete User'
        // Missing email and age
      };

      const res = await request(app)
        .post('/api/users')
        .send(incompleteUser)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation error');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const updateData = {
        name: 'Updated Test User',
        age: 29
      };

      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User updated successfully');
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.age).toBe(updateData.age);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = { name: 'Updated Name' };

      const res = await request(app)
        .put('/api/users/999')
        .send(updateData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        age: -10 // Invalid age
      };

      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete an existing user', async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');
      expect(res.body.data).toHaveProperty('id', createdUserId);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .delete('/api/users/invalid')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid user ID');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(res.body.error).toBe('Not Found');
      expect(res.body.message).toContain('Route /api/nonexistent not found');
    });
  });
});