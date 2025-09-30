const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const userSchema = Joi.object({
  id: Joi.string().uuid(),
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(1).max(120).required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  age: Joi.number().integer().min(1).max(120)
}).min(1);

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.email = data.email;
    this.age = data.age;
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
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.age !== undefined) this.age = data.age;
    this.updatedAt = new Date();
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

module.exports = { User, userSchema, updateUserSchema };