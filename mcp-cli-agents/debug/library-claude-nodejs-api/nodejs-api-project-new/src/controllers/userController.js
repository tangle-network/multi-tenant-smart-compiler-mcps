const userStore = require('../models/userStore');

class UserController {
  // GET /api/users - Get all users
  async getAllUsers(req, res, next) {
    try {
      const users = userStore.getAll();
      
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/:id - Get user by ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = userStore.getById(id);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users - Create new user
  async createUser(req, res, next) {
    try {
      const user = userStore.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/:id - Update user
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = userStore.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id - Delete user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = userStore.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();