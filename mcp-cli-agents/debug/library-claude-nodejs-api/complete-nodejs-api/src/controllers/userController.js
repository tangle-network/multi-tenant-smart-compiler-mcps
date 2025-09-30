const User = require('../models/User');
const userStore = require('../models/userStore');

class UserController {
  // GET /api/users
  static getAllUsers(req, res, next) {
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

  // GET /api/users/:id
  static getUserById(req, res, next) {
    try {
      const { error } = User.validateId(req.params.id);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          message: error.details[0].message
        });
      }

      const user = userStore.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${req.params.id} does not exist`
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

  // POST /api/users
  static createUser(req, res, next) {
    try {
      const { error, value } = User.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
      }

      // Check if email already exists
      if (userStore.emailExists(value.email)) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'A user with this email address already exists'
        });
      }

      const user = userStore.create(value);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/:id
  static updateUser(req, res, next) {
    try {
      const { error: idError } = User.validateId(req.params.id);
      if (idError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          message: idError.details[0].message
        });
      }

      const { error: bodyError, value } = User.validate(req.body, true);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: bodyError.details[0].message
        });
      }

      const userId = parseInt(req.params.id);
      const existingUser = userStore.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        });
      }

      // Check if email already exists (excluding current user)
      if (value.email && userStore.emailExists(value.email, userId)) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'A user with this email address already exists'
        });
      }

      const updatedUser = userStore.update(userId, value);
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id
  static deleteUser(req, res, next) {
    try {
      const { error } = User.validateId(req.params.id);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID',
          message: error.details[0].message
        });
      }

      const userId = parseInt(req.params.id);
      const deletedUser = userStore.delete(userId);
      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        });
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: deletedUser
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;