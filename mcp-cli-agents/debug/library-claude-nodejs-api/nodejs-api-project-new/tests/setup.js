const userStore = require('../src/models/userStore');

// Clear the user store before each test
beforeEach(() => {
  userStore.clear();
});

// Set test environment
process.env.NODE_ENV = 'test';