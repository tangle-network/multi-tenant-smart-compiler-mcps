const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const userSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(120).optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  age: Joi.number().integer().min(0).max(120).optional()
}).min(1);

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.email = data.email;
    this.age = data.age || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static validate(userData) {
    return userSchema.validate(userData);
  }

  static validateUpdate(userData) {
    return updateUserSchema.validate(userData);
  }

  update(data) {
    const { error, value } = User.validateUpdate(data);
    if (error) {
      throw new Error(error.details[0].message);
    }

    Object.keys(value).forEach(key => {
      this[key] = value[key];
    });
    this.updatedAt = new Date();
    
    return this;
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