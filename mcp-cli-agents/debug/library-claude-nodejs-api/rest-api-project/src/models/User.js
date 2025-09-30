const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(userData) {
    this.id = userData.id || uuidv4();
    this.name = userData.name;
    this.email = userData.email;
    this.age = userData.age;
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = userData.updatedAt || new Date().toISOString();
  }

  // Validation schema
  static getValidationSchema() {
    return Joi.object({
      name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name cannot exceed 50 characters',
          'any.required': 'Name is required'
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      age: Joi.number()
        .integer()
        .min(1)
        .max(120)
        .required()
        .messages({
          'number.base': 'Age must be a number',
          'number.integer': 'Age must be a whole number',
          'number.min': 'Age must be at least 1',
          'number.max': 'Age cannot exceed 120',
          'any.required': 'Age is required'
        })
    });
  }

  // Update validation schema (allows partial updates)
  static getUpdateValidationSchema() {
    return Joi.object({
      name: Joi.string()
        .min(2)
        .max(50)
        .messages({
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name cannot exceed 50 characters'
        }),
      email: Joi.string()
        .email()
        .messages({
          'string.email': 'Please provide a valid email address'
        }),
      age: Joi.number()
        .integer()
        .min(1)
        .max(120)
        .messages({
          'number.base': 'Age must be a number',
          'number.integer': 'Age must be a whole number',
          'number.min': 'Age must be at least 1',
          'number.max': 'Age cannot exceed 120'
        })
    });
  }

  // Validate user data
  static validate(userData) {
    return this.getValidationSchema().validate(userData, { abortEarly: false });
  }

  // Validate user data for updates
  static validateUpdate(userData) {
    return this.getUpdateValidationSchema().validate(userData, { abortEarly: false });
  }

  // Convert to JSON (remove sensitive data if needed)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      age: this.age,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Update user data
  update(userData) {
    if (userData.name !== undefined) this.name = userData.name;
    if (userData.email !== undefined) this.email = userData.email;
    if (userData.age !== undefined) this.age = userData.age;
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = User;