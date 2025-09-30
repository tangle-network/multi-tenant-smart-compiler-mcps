const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const userRoutes = require('../src/routes/userRoutes');
const errorHandler = require('../src/middleware/errorHandler');
const userStore = require('../src/models/userStore');

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.use('/api/users', userRoutes);
  app.use(errorHandler);
  
  return app;
};

describe('Users API', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/users', () => {
    test('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(response.body.data.length);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should return users with correct structure', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      const user = response.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('age');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user by valid ID', async () => {
      // First get all users to get a valid ID
      const usersResponse = await request(app).get('/api/users');
      const userId = usersResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    test('should create a new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25
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

    test('should reject user creation with invalid data', async () => {
      const userData = {
        name: 'T', // Too short
        email: 'invalid-email',
        age: -5 // Invalid age
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should reject user creation with missing required fields', async () => {
      const userData = {
        name: 'Test User'
        // Missing email and age
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    test('should reject user creation with duplicate email', async () => {
      // First get an existing user's email
      const usersResponse = await request(app).get('/api/users');
      const existingEmail = usersResponse.body.data[0].email;

      const userData = {
        name: 'Test User',
        email: existingEmail,
        age: 25
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user with valid data', async () => {
      // First get a user to update
      const usersResponse = await request(app).get('/api/users');
      const userId = usersResponse.body.data[0].id;

      const updateData = {
        name: 'Updated Name',
        age: 35
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.age).toBe(updateData.age);
    });

    test('should return 404 for non-existent user update', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    test('should reject update with invalid data', async () => {
      // First get a user to update
      const usersResponse = await request(app).get('/api/users');
      const userId = usersResponse.body.data[0].id;

      const updateData = {
        name: 'U', // Too short
        age: -10 // Invalid age
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user by valid ID', async () => {
      // First create a user to delete
      const userData = {
        name: 'User To Delete',
        email: 'delete@example.com',
        age: 30
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    test('should return 404 for non-existent user deletion', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });
});