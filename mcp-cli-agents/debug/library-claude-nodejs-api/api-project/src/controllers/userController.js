const User = require('../models/User');
const database = require('../utils/database');

const userController = {
  // GET /api/users - Get all users
  async getAllUsers(req, res, next) {
    try {
      const users = database.getAllUsers();
      
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/users/:id - Get user by ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const { error: idError } = User.validateId(id);
      if (idError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const user = database.getUserById(id);
      
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
  },

  // POST /api/users - Create new user
  async createUser(req, res, next) {
    try {
      const { error, value } = User.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      // Check if email already exists
      const existingUser = database.getUserByEmail(value.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }

      const newUser = database.createUser(value);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/users/:id - Update user
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const { error: idError } = User.validateId(id);
      if (idError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const { error, value } = User.validateUpdate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      // Check if user exists
      const existingUser = database.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being updated and already exists
      if (value.email && value.email !== existingUser.email) {
        const emailExists = database.getUserByEmail(value.email);
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      const updatedUser = database.updateUser(id, value);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/users/:id - Delete user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const { error: idError } = User.validateId(id);
      if (idError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const deleted = database.deleteUser(id);
      
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
};

module.exports = userController;