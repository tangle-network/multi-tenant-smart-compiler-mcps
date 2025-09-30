process.env.NODE_ENV = 'test';

beforeEach(() => {
  const userStore = require('../src/models/userStore');
  userStore.users.clear();
});