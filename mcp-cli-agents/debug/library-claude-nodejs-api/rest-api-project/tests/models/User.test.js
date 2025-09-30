const User = require('../../src/models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    test('should create a user with valid data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const user = new User(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.age).toBe(userData.age);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should generate unique IDs for different users', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const user1 = new User(userData);
      const user2 = new User(userData);

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('User Validation', () => {
    test('should validate correct user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeUndefined();
    });

    test('should reject user data with missing required fields', () => {
      const userData = {
        name: 'John Doe'
        // missing email and age
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details).toHaveLength(2);
    });

    test('should reject user data with invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    test('should reject user data with invalid age', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('age');
    });

    test('should reject user data with name too short', () => {
      const userData = {
        name: 'J',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });
  });

  describe('User Update Validation', () => {
    test('should validate partial update data', () => {
      const updateData = {
        name: 'Jane Doe'
      };

      const { error } = User.validateUpdate(updateData);
      expect(error).toBeUndefined();
    });

    test('should allow empty update data', () => {
      const updateData = {};

      const { error } = User.validateUpdate(updateData);
      expect(error).toBeUndefined();
    });
  });

  describe('User Methods', () => {
    test('should update user data correctly', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure updatedAt changes
      setTimeout(() => {
        user.update({
          name: 'Jane Doe',
          age: 31
        });

        expect(user.name).toBe('Jane Doe');
        expect(user.age).toBe(31);
        expect(user.email).toBe('john@example.com'); // unchanged
        expect(user.updatedAt).not.toBe(originalUpdatedAt);
      }, 1);
    });

    test('should return JSON representation', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const user = new User(userData);
      const json = user.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name', userData.name);
      expect(json).toHaveProperty('email', userData.email);
      expect(json).toHaveProperty('age', userData.age);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });
});