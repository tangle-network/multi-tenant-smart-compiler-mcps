const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(id, name, email, age, createdAt = new Date()) {
    this.id = id || uuidv4();
    this.name = name;
    this.email = email;
    this.age = age;
    this.createdAt = createdAt;
    this.updatedAt = new Date();
  }

  static validate(userData) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      age: Joi.number().integer().min(1).max(120).required()
    });

    return schema.validate(userData, { abortEarly: false });
  }

  static validateUpdate(userData) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      age: Joi.number().integer().min(1).max(120)
    }).min(1);

    return schema.validate(userData, { abortEarly: false });
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

module.exports = User;