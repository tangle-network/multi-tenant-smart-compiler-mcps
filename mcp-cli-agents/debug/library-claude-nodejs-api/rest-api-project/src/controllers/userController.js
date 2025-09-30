const User = require('../models/User');
const userStore = require('../models/userStore');

class UserController {
  // Get all users
  static async getAllUsers(req, res, next) {
    try {
      const users = userStore.findAll();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = userStore.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new user
  static async createUser(req, res, next) {
    try {
      // Validate input data
      const { error, value } = User.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      // Create user
      const user = userStore.create(value);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Update user
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = userStore.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate input data
      const { error, value } = User.validateUpdate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      // Update user
      const updatedUser = userStore.update(id, value);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Delete user
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const deleted = userStore.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;