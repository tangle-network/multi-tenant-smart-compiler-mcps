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
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should create a user without age (optional field)', () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const user = new User(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.age).toBeUndefined();
    });

    test('should throw error for invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      expect(() => new User(userData)).toThrow();
    });

    test('should throw error for missing required fields', () => {
      const userData = {
        age: 30
      };

      expect(() => new User(userData)).toThrow();
    });

    test('should throw error for invalid age', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5
      };

      expect(() => new User(userData)).toThrow();
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

    test('should return error for invalid user data', () => {
      const userData = {
        name: 'J',
        email: 'invalid-email'
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
    });
  });

  describe('User Update', () => {
    test('should update user with valid data', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const updateData = {
        name: 'John Smith',
        age: 31
      };

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a tiny bit to ensure updatedAt changes
      setTimeout(() => {
        user.update(updateData);

        expect(user.name).toBe(updateData.name);
        expect(user.age).toBe(updateData.age);
        expect(user.email).toBe('john@example.com'); // Unchanged
        expect(user.updatedAt).not.toBe(originalUpdatedAt);
      }, 1);
    });

    test('should throw error for invalid update data', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com'
      });

      const updateData = {
        email: 'invalid-email'
      };

      expect(() => user.update(updateData)).toThrow();
    });
  });

  describe('User JSON Serialization', () => {
    test('should convert user to JSON', () => {
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