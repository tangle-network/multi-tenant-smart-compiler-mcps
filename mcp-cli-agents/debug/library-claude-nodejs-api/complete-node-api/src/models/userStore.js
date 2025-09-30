const User = require('./User');

class UserStore {
  constructor() {
    this.users = new Map();
  }

  findAll() {
    return Array.from(this.users.values());
  }

  findById(id) {
    return this.users.get(id);
  }

  findByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  create(userData) {
    const user = new User(userData);
    this.users.set(user.id, user);
    return user;
  }

  update(id, userData) {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }
    user.update(userData);
    return user;
  }

  delete(id) {
    return this.users.delete(id);
  }

  exists(id) {
    return this.users.has(id);
  }

  clear() {
    this.users.clear();
  }
}

module.exports = new UserStore();