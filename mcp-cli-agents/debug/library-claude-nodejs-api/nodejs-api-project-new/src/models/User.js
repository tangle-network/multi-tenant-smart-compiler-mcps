const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// User validation schema
const userSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  age: Joi.number().integer().min(1).max(150).optional().messages({
    'number.min': 'Age must be at least 1',
    'number.max': 'Age cannot exceed 150',
    'number.integer': 'Age must be a whole number'
  }),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional()
});

// User update schema (all fields optional except for validation rules)
const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  age: Joi.number().integer().min(1).max(150).optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

class User {
  constructor(userData) {
    const { error, value } = userSchema.validate(userData);
    
    if (error) {
      throw error;
    }

    this.id = value.id || uuidv4();
    this.name = value.name;
    this.email = value.email;
    this.age = value.age;
    this.createdAt = value.createdAt || new Date();
    this.updatedAt = value.updatedAt || new Date();
  }

  // Static method to validate user data
  static validate(userData) {
    return userSchema.validate(userData);
  }

  // Static method to validate user update data
  static validateUpdate(userData) {
    return userUpdateSchema.validate(userData);
  }

  // Instance method to update user data
  update(updateData) {
    const { error, value } = User.validateUpdate(updateData);
    
    if (error) {
      throw error;
    }

    // Update only provided fields
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        this[key] = value[key];
      }
    });

    this.updatedAt = new Date();
    return this;
  }

  // Convert to plain object (for JSON responses)
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