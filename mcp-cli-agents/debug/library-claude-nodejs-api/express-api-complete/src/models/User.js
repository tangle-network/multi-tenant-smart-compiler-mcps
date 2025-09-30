const Joi = require('joi');

class User {
  constructor(userData) {
    this.id = userData.id || this.generateId();
    this.name = userData.name;
    this.email = userData.email;
    this.age = userData.age;
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = userData.updatedAt || new Date().toISOString();
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  static getValidationSchema() {
    return Joi.object({
      name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
          'string.empty': 'Name is required',
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name cannot exceed 50 characters'
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'string.empty': 'Email is required'
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
          'number.max': 'Age cannot exceed 120'
        })
    });
  }

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
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    });
  }

  static validate(userData) {
    return this.getValidationSchema().validate(userData, { abortEarly: false });
  }

  static validateUpdate(userData) {
    return this.getUpdateValidationSchema().validate(userData, { abortEarly: false });
  }

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

  update(updateData) {
    if (updateData.name !== undefined) this.name = updateData.name;
    if (updateData.email !== undefined) this.email = updateData.email;
    if (updateData.age !== undefined) this.age = updateData.age;
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = User;