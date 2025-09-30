const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

let users = [];

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  age: Joi.number().integer().min(1).max(120).optional().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 1',
    'number.max': 'Age cannot exceed 120'
  }),
  role: Joi.string().valid('user', 'admin').default('user')
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  age: Joi.number().integer().min(1).max(120).optional(),
  role: Joi.string().valid('user', 'admin').optional()
});

class User {
  constructor(userData) {
    this.id = uuidv4();
    this.name = userData.name;
    this.email = userData.email;
    this.age = userData.age || null;
    this.role = userData.role || 'user';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  static validate(userData) {
    return userSchema.validate(userData);
  }

  static validateUpdate(userData) {
    return updateUserSchema.validate(userData);
  }

  static findAll() {
    return users;
  }

  static findById(id) {
    return users.find(user => user.id === id);
  }

  static findByEmail(email) {
    return users.find(user => user.email === email);
  }

  static create(userData) {
    const { error, value } = User.validate(userData);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const existingUser = User.findByEmail(value.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = new User(value);
    users.push(user);
    return user;
  }

  static update(id, userData) {
    const { error, value } = User.validateUpdate(userData);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    if (value.email && value.email !== users[userIndex].email) {
      const existingUser = User.findByEmail(value.email);
      if (existingUser) {
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
      return false;
    }

    users.splice(userIndex, 1);
    return true;
  }

  static deleteAll() {
    users = [];
  }
}

module.exports = User;