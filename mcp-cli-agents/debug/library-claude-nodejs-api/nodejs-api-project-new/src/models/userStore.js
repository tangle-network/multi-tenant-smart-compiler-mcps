const User = require('./User');

class UserStore {
  constructor() {
    this.users = new Map();
    this.emailIndex = new Map(); // For quick email lookups
  }

  // Create a new user
  create(userData) {
    // Check if email already exists
    if (this.emailIndex.has(userData.email)) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const user = new User(userData);
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    
    return user;
  }

  // Get all users
  getAll() {
    return Array.from(this.users.values());
  }

  // Get user by ID
  getById(id) {
    const user = this.users.get(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  // Get user by email
  getByEmail(email) {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) : null;
  }

  // Update user
  update(id, updateData) {
    const user = this.getById(id);
    
    // If email is being updated, check for conflicts
    if (updateData.email && updateData.email !== user.email) {
      if (this.emailIndex.has(updateData.email)) {
        const error = new Error('User with this email already exists');
        error.statusCode = 409;
        throw error;
      }
      
      // Update email index
      this.emailIndex.delete(user.email);
      this.emailIndex.set(updateData.email, user.id);
    }

    user.update(updateData);
    return user;
  }

  // Delete user
  delete(id) {
    const user = this.getById(id);
    this.users.delete(id);
    this.emailIndex.delete(user.email);
    return user;
  }

  // Check if user exists
  exists(id) {
    return this.users.has(id);
  }

  // Get user count
  count() {
    return this.users.size;
  }

  // Clear all users (useful for testing)
  clear() {
    this.users.clear();
    this.emailIndex.clear();
  }
}

// Export singleton instance
module.exports = new UserStore();