const request = require('supertest');
const app = require('../src/server');

describe('User API Endpoints', () => {
  describe('GET /api/users', () => {
    test('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    test('should return all users when users exist', async () => {
      // First create a user
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Then get all users
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe(userData.name);
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.age).toBe(userData.age);
      expect(response.body.data.id).toBeDefined();
    });

    test('should return 400 for invalid user data', async () => {
      const userData = {
        name: 'J',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
    });

    test('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      // Create first user
      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user by valid ID', async () => {
      // First create a user
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      // Then get the user by ID
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.name).toBe(userData.name);
    });

    test('should return 404 for non-existent user ID', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user with valid data', async () => {
      // Create a user first
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      // Update the user
      const updateData = {
        name: 'John Smith',
        age: 31
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.age).toBe(updateData.age);
      expect(response.body.data.email).toBe(userData.email); // Unchanged
    });

    test('should return 404 for non-existent user ID', async () => {
      const updateData = {
        name: 'John Smith'
      };

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    test('should return 400 for invalid update data', async () => {
      // Create a user first
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      // Try to update with invalid data
      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user with valid ID', async () => {
      // Create a user first
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.data.id;

      // Delete the user
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.data.id).toBe(userId);

      // Verify user is deleted
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    test('should return 404 for non-existent user ID', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });
  });
});