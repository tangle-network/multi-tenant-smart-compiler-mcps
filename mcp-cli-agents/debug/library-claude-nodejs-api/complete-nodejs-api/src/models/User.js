const Joi = require('joi');

class User {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.email = data.email;
    this.age = data.age;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static validate(userData, isUpdate = false) {
    const schema = Joi.object({
      name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
          'string.empty': 'Name is required',
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name must not exceed 50 characters'
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
          'number.max': 'Age must not exceed 120'
        })
    });

    // For updates, make all fields optional
    if (isUpdate) {
      return schema.fork(['name', 'email', 'age'], (field) => field.optional()).validate(userData);
    }

    return schema.validate(userData);
  }

  static validateId(id) {
    const schema = Joi.number().integer().positive().required();
    return schema.validate(id);
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
}

module.exports = User;