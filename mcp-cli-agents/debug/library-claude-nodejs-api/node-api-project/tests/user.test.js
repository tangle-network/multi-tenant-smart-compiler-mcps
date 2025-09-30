const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('User API Endpoints', () => {
  beforeEach(() => {
    // Clear users before each test
    User.deleteAll();
    
    // Add test users
    User.create({
      name: 'Test User 1',
      email: 'test1@example.com',
      age: 25
    });
    
    User.create({
      name: 'Test User 2',
      email: 'test2@example.com',
      age: 30
    });
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('age');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a specific user', async () => {
      const users = User.getAll();
      const userId = users[0].id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.name).toBe('Test User 1');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        age: 28
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.age).toBe(newUser.age);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        name: 'A',
        email: 'invalid-email',
        age: -5
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should return 400 for duplicate email', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'test1@example.com',
        age: 25
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const users = User.getAll();
      const userId = users[0].id;
      
      const updateData = {
        name: 'Updated User',
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
      expect(response.body.data.email).toBe('test1@example.com'); // Should remain unchanged
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        name: 'Updated User'
      };

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid update data', async () => {
      const users = User.getAll();
      const userId = users[0].id;
      
      const invalidData = {
        age: -10
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete an existing user', async () => {
      const users = User.getAll();
      const userId = users[0].id;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.data.id).toBe(userId);

      // Verify user is actually deleted
      const remainingUsers = User.getAll();
      expect(remainingUsers).toHaveLength(1);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid JSON format');
    });
  });
});