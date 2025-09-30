const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.email = data.email;
    this.age = data.age;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static validate(userData) {
    const schema = Joi.object({
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

    return schema.validate(userData);
  }

  static validateUpdate(userData) {
    const schema = Joi.object({
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
    }).min(1);

    return schema.validate(userData);
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

  update(data) {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.age !== undefined) this.age = data.age;
    this.updatedAt = new Date().toISOString();
  }

  static validateId(id) {
    const schema = Joi.string().uuid().required();
    return schema.validate(id);
  }
}

module.exports = User;