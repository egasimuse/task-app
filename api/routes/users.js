const express = require('express');
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Users routes
router.get('/', authenticateToken, usersController.getAll);

module.exports = router;
