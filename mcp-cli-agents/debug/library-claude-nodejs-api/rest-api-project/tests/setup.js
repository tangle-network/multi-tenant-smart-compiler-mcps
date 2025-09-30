// Test setup file
const userStore = require('../src/models/userStore');

// Clear data before each test
beforeEach(() => {
  userStore.clear();
  userStore.initializeData();
});