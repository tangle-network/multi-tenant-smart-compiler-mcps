const User = require('../../src/models/User');

describe('User Model', () => {
  describe('User Constructor', () => {
    it('should create a user with all properties', () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      const user = new User(userData);

      expect(user.id).toBe(1);
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(30);
      expect(user.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(user.updatedAt).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should create a user with default timestamps when not provided', () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25
      };

      const user = new User(userData);

      expect(user.id).toBeNull();
      expect(user.name).toBe('Jane Doe');
      expect(user.email).toBe('jane@example.com');
      expect(user.age).toBe(25);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(new Date(user.createdAt)).toBeInstanceOf(Date);
      expect(new Date(user.updatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('User Validation', () => {
    describe('Valid data', () => {
      it('should validate correct user data', () => {
        const validUser = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        };

        const { error, value } = User.validate(validUser);

        expect(error).toBeUndefined();
        expect(value).toEqual(validUser);
      });
    });

    describe('Name validation', () => {
      it('should reject empty name', () => {
        const userData = {
          name: '',
          email: 'john@example.com',
          age: 30
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Name is required');
      });

      it('should reject name shorter than 2 characters', () => {
        const userData = {
          name: 'J',
          email: 'john@example.com',
          age: 30
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Name must be at least 2 characters long');
      });

      it('should reject name longer than 50 characters', () => {
        const userData = {
          name: 'J'.repeat(51),
          email: 'john@example.com',
          age: 30
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Name must not exceed 50 characters');
      });
    });

    describe('Email validation', () => {
      it('should reject invalid email format', () => {
        const userData = {
          name: 'John Doe',
          email: 'invalid-email',
          age: 30
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Please provide a valid email address');
      });

      it('should reject empty email', () => {
        const userData = {
          name: 'John Doe',
          email: '',
          age: 30
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Email is required');
      });
    });

    describe('Age validation', () => {
      it('should reject non-numeric age', () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 'thirty'
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Age must be a number');
      });

      it('should reject decimal age', () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30.5
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Age must be a whole number');
      });

      it('should reject age less than 1', () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 0
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Age must be at least 1');
      });

      it('should reject age greater than 120', () => {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 121
        };

        const { error } = User.validate(userData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Age must not exceed 120');
      });
    });

    describe('Update validation', () => {
      it('should allow partial updates with valid data', () => {
        const updateData = {
          name: 'Updated Name'
        };

        const { error, value } = User.validate(updateData, true);

        expect(error).toBeUndefined();
        expect(value).toEqual(updateData);
      });

      it('should reject invalid data in updates', () => {
        const updateData = {
          age: -5
        };

        const { error } = User.validate(updateData, true);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('Age must be at least 1');
      });
    });
  });

  describe('ID Validation', () => {
    it('should validate positive integer IDs', () => {
      const { error, value } = User.validateId(1);

      expect(error).toBeUndefined();
      expect(value).toBe(1);
    });

    it('should reject negative IDs', () => {
      const { error } = User.validateId(-1);

      expect(error).toBeDefined();
    });

    it('should reject non-numeric IDs', () => {
      const { error } = User.validateId('abc');

      expect(error).toBeDefined();
    });

    it('should reject decimal IDs', () => {
      const { error } = User.validateId(1.5);

      expect(error).toBeDefined();
    });
  });

  describe('toJSON method', () => {
    it('should return JSON representation of user', () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      const user = new User(userData);
      const json = user.toJSON();

      expect(json).toEqual(userData);
    });
  });
});