const request = require('supertest');
const app = require('../src/app');

describe('User API Endpoints', () => {
  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should return all users', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      await request(app)
        .post('/api/users')
        .send(userData);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('John Doe');
      expect(response.body.count).toBe(1);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
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
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe('john@example.com');
      expect(response.body.data.age).toBe(30);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid user data', async () => {
      const userData = {
        name: 'Jo',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      await request(app)
        .post('/api/users')
        .send(userData);

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Conflict');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by id', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.name).toBe('John Doe');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData);

      const userId = createResponse.body.data.id;
      const updateData = { name: 'John Smith', age: 35 };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Smith');
      expect(response.body.data.age).toBe(35);
      expect(response.body.data.email).toBe('john@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/non-existent-id')
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(userData);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);

      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('API Root Endpoints', () => {
    it('should return welcome message at root', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Welcome to Node.js REST API');
    });

    it('should return API info at /api', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API is running');
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });
  });
});