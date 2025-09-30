const User = require('./User');

class UserStore {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
    this.seedData();
  }

  seedData() {
    const sampleUsers = [
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
    ];

    sampleUsers.forEach(userData => {
      const user = new User(this.nextId++, userData.name, userData.email, userData.age);
      this.users.set(user.id, user);
    });
  }

  findAll() {
    return Array.from(this.users.values());
  }

  findById(id) {
    return this.users.get(parseInt(id));
  }

  findByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  create(userData) {
    const user = new User(this.nextId++, userData.name, userData.email, userData.age);
    this.users.set(user.id, user);
    return user;
  }

  update(id, userData) {
    const existingUser = this.users.get(parseInt(id));
    if (!existingUser) {
      return null;
    }

    existingUser.update(userData);
    return existingUser;
  }

  delete(id) {
    const user = this.users.get(parseInt(id));
    if (user) {
      this.users.delete(parseInt(id));
      return user;
    }
    return null;
  }

  clear() {
    this.users.clear();
    this.nextId = 1;
  }
}

module.exports = new UserStore();