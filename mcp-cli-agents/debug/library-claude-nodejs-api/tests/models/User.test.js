const User = require('../../src/models/User');

describe('User Model', () => {
  describe('User.validate', () => {
    it('should validate correct user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const { error, value } = User.validate(userData);
      expect(error).toBeUndefined();
      expect(value).toEqual(userData);
    });

    it('should reject invalid name', () => {
      const userData = {
        name: 'A',
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should reject invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should reject invalid age', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: -5
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('age');
    });

    it('should reject missing required fields', () => {
      const userData = {
        name: 'John Doe'
      };

      const { error } = User.validate(userData);
      expect(error).toBeDefined();
    });
  });

  describe('User.validateUpdate', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'John Updated'
      };

      const { error, value } = User.validateUpdate(updateData);
      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });

    it('should reject empty update data', () => {
      const updateData = {};

      const { error } = User.validateUpdate(updateData);
      expect(error).toBeDefined();
    });
  });

  describe('User constructor and methods', () => {
    it('should create a user instance', () => {
      const user = new User(1, 'John Doe', 'john@example.com', 30);
      
      expect(user.id).toBe(1);
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(30);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should convert to JSON correctly', () => {
      const user = new User(1, 'John Doe', 'john@example.com', 30);
      const json = user.toJSON();

      expect(json).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    });

    it('should update user data correctly', async () => {
      const user = new User(1, 'John Doe', 'john@example.com', 30);
      const originalUpdatedAt = user.updatedAt;
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      
      user.update({
        name: 'John Updated',
        age: 31
      });

      expect(user.name).toBe('John Updated');
      expect(user.age).toBe(31);
      expect(user.email).toBe('john@example.com');
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});