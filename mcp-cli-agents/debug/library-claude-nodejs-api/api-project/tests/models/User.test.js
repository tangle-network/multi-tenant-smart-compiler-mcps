const User = require('../../src/models/User');

describe('User Model', () => {
  describe('validate', () => {
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

    it('should reject missing name', () => {
      const userData = {
        email: 'john@example.com',
        age: 30
      };

      const { error } = User.validate(userData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Name is required');
    });

    it('should reject invalid email', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };

      const { error } = User.validate(userData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Please provide a valid email address');
    });

    it('should reject age below minimum', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 0
      };

      const { error } = User.validate(userData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Age must be at least 1');
    });

    it('should reject age above maximum', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 121
      };

      const { error } = User.validate(userData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Age cannot exceed 120');
    });

    it('should reject non-integer age', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30.5
      };

      const { error } = User.validate(userData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('Age must be a whole number');
    });
  });

  describe('validateUpdate', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'John Smith'
      };

      const { error, value } = User.validateUpdate(updateData);

      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });

    it('should reject empty update data', () => {
      const { error } = User.validateUpdate({});

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must contain at least 1 keys');
    });

    it('should validate email in update', () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const { error, value } = User.validateUpdate(updateData);

      expect(error).toBeUndefined();
      expect(value).toEqual(updateData);
    });
  });

  describe('User constructor and toJSON', () => {
    it('should create user with all properties', () => {
      const userData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      const user = new User(userData);

      expect(user.toJSON()).toEqual(userData);
    });

    it('should create user with auto-generated UUID and timestamps', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const user = new User(userData);

      const json = user.toJSON();
      expect(json.id).toBeDefined();
      expect(json.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(json.name).toBe('John Doe');
      expect(json.email).toBe('john@example.com');
      expect(json.age).toBe(30);
      expect(json.createdAt).toBeDefined();
      expect(json.updatedAt).toBeDefined();
      expect(new Date(json.createdAt)).toBeInstanceOf(Date);
      expect(new Date(json.updatedAt)).toBeInstanceOf(Date);
    });

    it('should update user properties and updatedAt timestamp', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        user.update({ name: 'John Smith', age: 31 });
        
        expect(user.name).toBe('John Smith');
        expect(user.age).toBe(31);
        expect(user.email).toBe('john@example.com'); // Should remain unchanged
        expect(user.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('validateId', () => {
    it('should validate correct UUID', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const { error } = User.validateId(validUuid);
      
      expect(error).toBeUndefined();
    });

    it('should reject invalid UUID format', () => {
      const invalidId = 'invalid-id';
      const { error } = User.validateId(invalidId);
      
      expect(error).toBeDefined();
    });
  });
});