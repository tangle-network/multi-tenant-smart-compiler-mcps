const User = require('./User');

class UserStore {
  constructor() {
    this.users = new Map();
  }

  async findAll() {
    return Array.from(this.users.values());
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email) || null;
  }

  async create(userData) {
    const { error, value } = User.validate(userData);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const existingUser = await this.findByEmail(value.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = new User(value);
    this.users.set(user.id, user);
    return user;
  }

  async update(id, userData) {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    user.update(userData);
    return user;
  }

  async delete(id) {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }
    
    this.users.delete(id);
    return user;
  }

  async count() {
    return this.users.size;
  }
}

module.exports = new UserStore();