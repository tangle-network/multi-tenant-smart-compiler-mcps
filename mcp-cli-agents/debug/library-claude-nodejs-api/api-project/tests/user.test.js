const request = require('supertest');
const app = require('../src/server');
const database = require('../src/utils/database');

describe('User API Endpoints', () => {
  // Clear database before each test
  beforeEach(() => {
    database.clearAll();
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        count: 0,
        data: []
      });
    });

    it('should return all users when users exist', async () => {
      // Create test users
      database.createUser({ name: 'John Doe', email: 'john@example.com', age: 30 });
      database.createUser({ name: 'Jane Smith', email: 'jane@example.com', age: 25 });

      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by valid ID', async () => {
      const user = database.createUser({ name: 'John Doe', email: 'john@example.com', age: 30 });

      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.name).toBe('John Doe');
    });

    it('should return 404 for non-existent user', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const res = await request(app)
        .get(`/api/users/${validUuid}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .get('/api/users/invalid')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid user ID format');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data.name).toBe(userData.name);
      expect(res.body.data.email).toBe(userData.email);
      expect(res.body.data.age).toBe(userData.age);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.createdAt).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'John' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation error');
      expect(res.body.errors).toContain('Email is required');
      expect(res.body.errors).toContain('Age is required');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Please provide a valid email address');
    });

    it('should return 409 for duplicate email', async () => {
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
      const res = await request(app)
        .post('/api/users')
        .send({ ...userData, name: 'Jane Doe' })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with valid data', async () => {
      const user = database.createUser({ name: 'John Doe', email: 'john@example.com', age: 30 });
      const updateData = { name: 'John Smith', age: 31 };

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User updated successfully');
      expect(res.body.data.name).toBe('John Smith');
      expect(res.body.data.age).toBe(31);
      expect(res.body.data.email).toBe('john@example.com'); // Should remain unchanged
    });

    it('should return 404 for non-existent user', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const res = await request(app)
        .put(`/api/users/${validUuid}`)
        .send({ name: 'John Smith' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 400 for invalid update data', async () => {
      const user = database.createUser({ name: 'John Doe', email: 'john@example.com', age: 30 });

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .send({ age: -5 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Age must be at least 1');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user by valid ID', async () => {
      const user = database.createUser({ name: 'John Doe', email: 'john@example.com', age: 30 });

      const res = await request(app)
        .delete(`/api/users/${user.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = database.getUserById(user.id);
      expect(deletedUser).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const res = await request(app)
        .delete(`/api/users/${validUuid}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Route not found');
    });
  });
});