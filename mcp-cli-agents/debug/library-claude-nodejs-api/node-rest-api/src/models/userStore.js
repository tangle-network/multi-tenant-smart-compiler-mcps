const { User } = require('./User');

class UserStore {
  constructor() {
    this.users = new Map();
    this.seedData();
  }

  seedData() {
    const sampleUsers = [
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
    ];

    sampleUsers.forEach(userData => {
      const user = new User(userData);
      this.users.set(user.id, user);
    });
  }

  getAll() {
    return Array.from(this.users.values());
  }

  getById(id) {
    return this.users.get(id);
  }

  getByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  create(userData) {
    const user = new User(userData);
    this.users.set(user.id, user);
    return user;
  }

  update(id, userData) {
    const user = this.users.get(id);
    if (!user) return null;
    
    user.update(userData);
    return user;
  }

  delete(id) {
    const user = this.users.get(id);
    if (!user) return null;
    
    this.users.delete(id);
    return user;
  }

  exists(id) {
    return this.users.has(id);
  }

  emailExists(email, excludeId = null) {
    return Array.from(this.users.values()).some(user => 
      user.email === email && user.id !== excludeId
    );
  }
}

module.exports = new UserStore();