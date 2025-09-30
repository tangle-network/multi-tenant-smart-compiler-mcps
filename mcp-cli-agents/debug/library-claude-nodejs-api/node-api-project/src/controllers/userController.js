const User = require('../models/User');

const userController = {
  // GET /api/users
  getAllUsers: async (req, res, next) => {
    try {
      const users = User.getAll();
      
      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/:id
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = User.getById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/users
  createUser: async (req, res, next) => {
    try {
      const userData = req.body;
      const newUser = User.create(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      if (error.message.includes('Validation error') || error.message.includes('Email already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  // PUT /api/users/:id
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userData = req.body;

      const updatedUser = User.update(id, userData);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      if (error.message.includes('Validation error') || error.message.includes('Email already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  // DELETE /api/users/:id
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedUser = User.delete(id);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        data: deletedUser
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;