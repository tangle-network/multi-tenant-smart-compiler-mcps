const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// In-memory storage (replace with database in production)
let users = [
  {
    id: uuidv4(),
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Validation schema
const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(1).max(150).required()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  age: Joi.number().integer().min(1).max(150)
}).min(1); // At least one field is required for update

class User {
  static validate(userData) {
    return userSchema.validate(userData);
  }

  static validateUpdate(userData) {
    return updateUserSchema.validate(userData);
  }

  static getAll() {
    return users;
  }

  static getById(id) {
    return users.find(user => user.id === id);
  }

  static getByEmail(email) {
    return users.find(user => user.email === email);
  }

  static create(userData) {
    const { error, value } = this.validate(userData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check if email already exists
    if (this.getByEmail(value.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: uuidv4(),
      ...value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    return newUser;
  }

  static update(id, userData) {
    const { error, value } = this.validateUpdate(userData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    // Check if email already exists (excluding current user)
    if (value.email && value.email !== users[userIndex].email) {
      const existingUser = this.getByEmail(value.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already exists');
      }
    }

    users[userIndex] = {
      ...users[userIndex],
      ...value,
      updatedAt: new Date().toISOString()
    };

    return users[userIndex];
  }

  static delete(id) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    return deletedUser;
  }

  static deleteAll() {
    users = [];
  }

  static count() {
    return users.length;
  }
}

module.exports = User;