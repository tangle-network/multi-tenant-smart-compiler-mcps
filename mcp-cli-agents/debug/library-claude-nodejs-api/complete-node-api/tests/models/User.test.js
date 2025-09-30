const User = require('../../src/models/User');

describe('User Model', () => {
  describe('User creation', () => {
    it('should create a user with valid data', () => {
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

    it('should create a user without age', () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane@example.com'
      };

      const user = new User(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.age).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate correct user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validateCreate(userData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      const { error } = User.validateCreate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('email');
    });

    it('should reject short name', () => {
      const userData = {
        name: 'J',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validateCreate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('name');
    });

    it('should reject invalid age', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5
      };

      const { error } = User.validateCreate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('age');
    });
  });

  describe('User update', () => {
    it('should update user fields', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const originalUpdatedAt = user.updatedAt;
      
      setTimeout(() => {
        user.update({
          name: 'John Smith',
          age: 35
        });

        expect(user.name).toBe('John Smith');
        expect(user.age).toBe(35);
        expect(user.email).toBe('john@example.com');
        expect(user.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('JSON serialization', () => {
    it('should convert to JSON correctly', () => {
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