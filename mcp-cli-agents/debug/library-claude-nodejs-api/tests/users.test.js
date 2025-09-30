const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/models/userStore');

describe('Users API', () => {
  beforeEach(() => {
    userStore.clear();
    userStore.seedData();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('age');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by ID', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBe('John Doe');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'Alice Johnson',
        email: 'alice@example.com',
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
        age: 150
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toHaveLength(3);
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUser = {
        name: 'John Smith',
        email: 'john@example.com',
        age: 25
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteUser = {
        name: 'Incomplete User'
      };

      const response = await request(app)
        .post('/api/users')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const updateData = {
        name: 'John Smith',
        age: 31
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.age).toBe(updateData.age);
      expect(response.body.data.email).toBe('john@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/users/999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdate = {
        age: 'invalid-age'
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should return 409 for duplicate email on update', async () => {
      const updateData = {
        email: 'jane@example.com'
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should allow updating user with same email', async () => {
      const updateData = {
        email: 'john@example.com',
        name: 'John Updated'
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Updated');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.data.id).toBe(1);

      const getResponse = await request(app)
        .get('/api/users/1')
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Root endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.message).toContain('Node.js REST API');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.endpoints).toHaveProperty('users');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('User Model', () => {
  const User = require('../src/models/User');

  describe('validate', () => {
    it('should validate correct user data', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25
      };

      const { error } = User.validate(userData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid user data', () => {
      const userData = {
        name: 'A',
        email: 'invalid-email',
        age: -5
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details).toHaveLength(3);
    });
  });

  describe('validateUpdate', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'Updated Name'
      };

      const { error } = User.validateUpdate(updateData);
      expect(error).toBeUndefined();
    });

    it('should reject empty update data', () => {
      const { error } = User.validateUpdate({});
      expect(error).toBeDefined();
    });
  });
});

describe('UserStore', () => {
  beforeEach(() => {
    userStore.clear();
  });

  it('should initialize with seed data', () => {
    userStore.seedData();
    const users = userStore.findAll();
    expect(users).toHaveLength(3);
  });

  it('should create and find users', () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      age: 25
    };

    const user = userStore.create(userData);
    expect(user.id).toBe(1);

    const foundUser = userStore.findById(1);
    expect(foundUser.name).toBe(userData.name);
  });

  it('should find user by email', () => {
    userStore.seedData();
    const user = userStore.findByEmail('john@example.com');
    expect(user.name).toBe('John Doe');
  });

  it('should update users', () => {
    userStore.seedData();
    const updateData = { name: 'Updated Name' };
    const updatedUser = userStore.update(1, updateData);
    
    expect(updatedUser.name).toBe('Updated Name');
    expect(updatedUser.email).toBe('john@example.com');
  });

  it('should delete users', () => {
    userStore.seedData();
    const deletedUser = userStore.delete(1);
    
    expect(deletedUser.id).toBe(1);
    expect(userStore.findById(1)).toBeUndefined();
  });
});