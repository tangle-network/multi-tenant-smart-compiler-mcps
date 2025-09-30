const User = require('./User');

class UserStore {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
    
    // Add some sample data
    this.seedData();
  }

  seedData() {
    const sampleUsers = [
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
    ];

    sampleUsers.forEach(userData => {
      this.create(userData);
    });
  }

  create(userData) {
    const user = new User({
      ...userData,
      id: this.nextId++
    });
    
    this.users.set(user.id, user);
    return user;
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

  update(id, updateData) {
    const user = this.users.get(parseInt(id));
    if (!user) {
      return null;
    }

    const updatedUser = new User({
      ...user,
      ...updateData,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString()
    });

    this.users.set(parseInt(id), updatedUser);
    return updatedUser;
  }

  delete(id) {
    const user = this.users.get(parseInt(id));
    if (!user) {
      return null;
    }

    this.users.delete(parseInt(id));
    return user;
  }

  exists(id) {
    return this.users.has(parseInt(id));
  }

  emailExists(email, excludeId = null) {
    return Array.from(this.users.values()).some(user => 
      user.email === email && user.id !== excludeId
    );
  }
}

// Export singleton instance
module.exports = new UserStore();