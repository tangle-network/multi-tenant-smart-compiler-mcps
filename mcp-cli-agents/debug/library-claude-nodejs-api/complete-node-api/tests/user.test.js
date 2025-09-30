const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/models/userStore');

describe('User API', () => {
  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const res = await request(app).get('/api/users');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('should return all users', async () => {
      userStore.create({ name: 'John Doe', email: 'john@example.com', age: 30 });
      userStore.create({ name: 'Jane Smith', email: 'jane@example.com', age: 25 });

      const res = await request(app).get('/api/users');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const res = await request(app)
        .post('/api/users')
        .send(userData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(userData.name);
      expect(res.body.data.email).toBe(userData.email);
      expect(res.body.data.age).toBe(userData.age);
      expect(res.body.data.id).toBeDefined();
    });

    it('should return error for invalid user data', async () => {
      const userData = {
        name: 'J',
        email: 'invalid-email'
      };

      const res = await request(app)
        .post('/api/users')
        .send(userData);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Validation Error');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      await request(app).post('/api/users').send(userData);
      const res = await request(app).post('/api/users').send(userData);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('User with this email already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const user = userStore.create({ name: 'John Doe', email: 'john@example.com', age: 30 });

      const res = await request(app).get(`/api/users/${user.id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.name).toBe(user.name);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/non-existent-id');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const user = userStore.create({ name: 'John Doe', email: 'john@example.com', age: 30 });
      const updateData = { name: 'John Smith', age: 35 };

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.age).toBe(updateData.age);
      expect(res.body.data.email).toBe(user.email);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id')
        .send({ name: 'Updated Name' });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const user = userStore.create({ name: 'John Doe', email: 'john@example.com', age: 30 });

      const res = await request(app).delete(`/api/users/${user.id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).delete('/api/users/non-existent-id');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('User not found');
    });
  });
});

describe('API Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeDefined();
  });

  it('should return welcome message on root endpoint', async () => {
    const res = await request(app).get('/');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Welcome to the Complete Node.js REST API');
    expect(res.body.version).toBe('1.0.0');
  });
});