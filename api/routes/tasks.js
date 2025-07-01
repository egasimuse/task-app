const express = require('express');
const tasksController = require('../controllers/tasksController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Tasks routes
router.get('/', authenticateToken, tasksController.getAll);
router.get('/assigned', authenticateToken, tasksController.getAssigned);
router.post('/', authenticateToken, tasksController.create);
router.put('/:id', authenticateToken, tasksController.update);
router.patch('/:id/complete', authenticateToken, tasksController.complete);
router.delete('/:id', authenticateToken, tasksController.delete);

module.exports = router;
