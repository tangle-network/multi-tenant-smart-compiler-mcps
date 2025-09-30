const User = require('./User');

class UserStore {
  constructor() {
    this.users = new Map();
    this.initializeData();
  }

  // Initialize with sample data
  initializeData() {
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

  // Get all users
  findAll() {
    return Array.from(this.users.values());
  }

  // Get user by ID
  findById(id) {
    return this.users.get(id) || null;
  }

  // Find user by email
  findByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email) || null;
  }

  // Create new user
  create(userData) {
    // Check if email already exists
    const existingUser = this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = new User(userData);
    this.users.set(user.id, user);
    return user;
  }

  // Update user
  update(id, userData) {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    // Check if email is being changed and if it already exists
    if (userData.email && userData.email !== user.email) {
      const existingUser = this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    user.update(userData);
    return user;
  }

  // Delete user
  delete(id) {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }
    
    this.users.delete(id);
    return true;
  }

  // Get total count
  count() {
    return this.users.size;
  }

  // Clear all data (useful for testing)
  clear() {
    this.users.clear();
  }
}

// Export a singleton instance
module.exports = new UserStore();