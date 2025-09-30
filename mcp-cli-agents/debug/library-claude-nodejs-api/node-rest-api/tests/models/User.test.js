const { User } = require('../../src/models/User');

describe('User Model', () => {
  describe('Validation', () => {
    it('should validate correct user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid name', () => {
      const userData = {
        name: 'A',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
    });

    it('should reject invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
    });

    it('should reject invalid age', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
    });
  });

  describe('User Creation', () => {
    it('should create user with correct properties', () => {
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
  });

  describe('User Update', () => {
    it('should update user properties', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const originalUpdatedAt = user.updatedAt;
      
      setTimeout(() => {
        user.update({
          name: 'Jane Doe',
          age: 25
        });

        expect(user.name).toBe('Jane Doe');
        expect(user.age).toBe(25);
        expect(user.email).toBe('john@example.com');
        expect(user.updatedAt).not.toBe(originalUpdatedAt);
      }, 1);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
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