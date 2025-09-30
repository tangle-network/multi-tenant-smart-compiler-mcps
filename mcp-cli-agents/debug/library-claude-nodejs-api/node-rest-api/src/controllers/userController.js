const { User, updateUserSchema } = require('../models/User');
const userStore = require('../models/userStore');

const getAllUsers = (req, res, next) => {
  try {
    const users = userStore.getAll();
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = (req, res, next) => {
  try {
    const { id } = req.params;
    const user = userStore.getById(id);
    
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
};

const createUser = (req, res, next) => {
  try {
    const { error, value } = User.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    if (userStore.emailExists(value.email)) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
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
};

const updateUser = (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!userStore.exists(id)) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    if (value.email && userStore.emailExists(value.email, id)) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const updatedUser = userStore.update(id, value);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedUser = userStore.delete(id);
    
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
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};