const request = require('supertest');
const { app } = require('../src/server');
const User = require('../src/models/User');

describe('User API', () => {
  beforeEach(() => {
    User.deleteAll();
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should return all users when users exist', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      User.create(userData);

      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe(userData.name);
      expect(res.body.data[0].email).toBe(userData.email);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25,
        role: 'user'
      };

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data.name).toBe(userData.name);
      expect(res.body.data.email).toBe(userData.email);
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: 'J',
        email: 'invalid-email'
      };

      const res = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('validation');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      User.create(userData);

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by id', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      const user = User.create(userData);

      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.name).toBe(userData.name);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      const user = User.create(userData);

      const updateData = {
        name: 'John Smith',
        age: 31
      };

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User updated successfully');
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.age).toBe(updateData.age);
      expect(res.body.data.email).toBe(userData.email);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user by id', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      const user = User.create(userData);

      const res = await request(app)
        .delete(`/api/users/${user.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');

      const deletedUser = User.findById(user.id);
      expect(deletedUser).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/non-existent-id')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });
});