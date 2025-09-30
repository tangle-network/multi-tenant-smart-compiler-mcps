const User = require('../models/User');

// In-memory database simulation
// In a real application, this would be replaced with a proper database
let users = [];

const database = {
  // Get all users
  getAllUsers() {
    return [...users];
  },

  // Get user by ID
  getUserById(id) {
    return users.find(user => user.id === id);
  },

  // Get user by email
  getUserByEmail(email) {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Create new user
  createUser(userData) {
    const newUser = new User(userData);
    users.push(newUser);
    return newUser.toJSON();
  },

  // Update user
  updateUser(id, userData) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }
    
    users[userIndex].update(userData);
    return users[userIndex].toJSON();
  },

  // Delete user
  deleteUser(id) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return false;
    }
    
    users.splice(userIndex, 1);
    return true;
  },

  // Clear all users (useful for testing)
  clearAll() {
    users = [];
  },

  // Get users count
  getUsersCount() {
    return users.length;
  }
};

module.exports = database;