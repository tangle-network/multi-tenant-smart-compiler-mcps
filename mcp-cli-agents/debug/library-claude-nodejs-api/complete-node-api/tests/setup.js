const userStore = require('../src/models/userStore');

beforeEach(() => {
  userStore.clear();
});

afterEach(() => {
  userStore.clear();
});