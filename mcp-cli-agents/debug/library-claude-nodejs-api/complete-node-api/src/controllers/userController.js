const User = require('../models/User');
const userStore = require('../models/userStore');

const getAllUsers = async (req, res, next) => {
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
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = userStore.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { error, value } = User.validateCreate(req.body);
    
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    const existingUser = userStore.findByEmail(value.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User with this email already exists'
        }
      });
    }

    const user = userStore.create(value);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = User.validateUpdate(req.body);
    
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    if (value.email) {
      const existingUser = userStore.findByEmail(value.email);
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User with this email already exists'
          }
        });
      }
    }

    const user = userStore.update(id, value);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = userStore.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'User deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};