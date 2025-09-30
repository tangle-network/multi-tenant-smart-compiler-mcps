const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// POST /api/users - Create a new user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update user by ID
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', userController.deleteUser);

module.exports = router;