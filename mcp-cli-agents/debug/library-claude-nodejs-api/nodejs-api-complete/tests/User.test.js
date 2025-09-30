const User = require('../src/models/User');

describe('User Model', () => {
  describe('constructor', () => {
    it('should create a user with required fields', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const user = new User(userData);

      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with optional age field', () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25
      };

      const user = new User(userData);

      expect(user.age).toBe(25);
    });
  });

  describe('validate', () => {
    it('should validate valid user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('email');
    });

    it('should reject missing name', () => {
      const userData = {
        email: 'john@example.com'
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('name');
    });

    it('should reject invalid age', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -1
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('age');
    });
  });

  describe('update', () => {
    it('should update user fields', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com'
      });

      const originalUpdatedAt = user.updatedAt;
      
      setTimeout(() => {
        user.update({ name: 'John Smith', age: 30 });
        
        expect(user.name).toBe('John Smith');
        expect(user.age).toBe(30);
        expect(user.email).toBe('john@example.com');
        expect(user.updatedAt).not.toBe(originalUpdatedAt);
      }, 1);
    });

    it('should throw error for invalid update data', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com'
      });

      expect(() => {
        user.update({ email: 'invalid-email' });
      }).toThrow();
    });
  });

  describe('toJSON', () => {
    it('should return user data as JSON', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const user = new User(userData);
      const json = user.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name', 'John Doe');
      expect(json).toHaveProperty('email', 'john@example.com');
      expect(json).toHaveProperty('age', 30);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });
});