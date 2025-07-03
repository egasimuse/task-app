const request = require('supertest');
const express = require('express');
const tasksRoutes = require('../../routes/tasks');

// Mock the tasks controller
jest.mock('../../controllers/tasksController', () => ({
  getAll: jest.fn(),
  getAssigned: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  complete: jest.fn()
}));

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, username: 'testuser', email: 'test@example.com' };
    next();
  })
}));

const tasksController = require('../../controllers/tasksController');

describe('Tasks Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/tasks', tasksRoutes);
    jest.clearAllMocks();
  });

  describe('GET /tasks', () => {
    it('should call getAll controller', async () => {
      // Arrange
      tasksController.getAll.mockImplementation((req, res) => {
        res.json([{ id: 1, title: 'Test Task' }]);
      });

      // Act
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(tasksController.getAll).toHaveBeenCalled();
    });
  });

  describe('GET /tasks/assigned', () => {
    it('should call getAssigned controller', async () => {
      // Arrange
      tasksController.getAssigned.mockImplementation((req, res) => {
        res.json([{ id: 1, title: 'Assigned Task', assigned_to: 1 }]);
      });

      // Act
      const response = await request(app)
        .get('/tasks/assigned')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(tasksController.getAssigned).toHaveBeenCalled();
    });
  });

  describe('GET /tasks/:id', () => {
    it('should call getById controller', async () => {
      // Arrange
      tasksController.getById.mockImplementation((req, res) => {
        res.json({ id: 1, title: 'Test Task' });
      });

      // Act
      const response = await request(app)
        .get('/tasks/1')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(tasksController.getById).toHaveBeenCalled();
    });
  });

  describe('POST /tasks', () => {
    it('should call create controller', async () => {
      // Arrange
      tasksController.create.mockImplementation((req, res) => {
        res.status(201).json({ message: 'Task created successfully', taskId: 1 });
      });

      // Act
      const response = await request(app)
        .post('/tasks')
        .set('Authorization', 'Bearer mock_token')
        .send({
          title: 'New Task',
          description: 'Task description',
          priority: 'medium'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(tasksController.create).toHaveBeenCalled();
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should call update controller', async () => {
      // Arrange
      tasksController.update.mockImplementation((req, res) => {
        res.json({ message: 'Task updated successfully' });
      });

      // Act
      const response = await request(app)
        .put('/tasks/1')
        .set('Authorization', 'Bearer mock_token')
        .send({
          title: 'Updated Task',
          status: 'in_progress'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(tasksController.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should call delete controller', async () => {
      // Arrange
      tasksController.delete.mockImplementation((req, res) => {
        res.json({ message: 'Task deleted successfully' });
      });

      // Act
      const response = await request(app)
        .delete('/tasks/1')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(tasksController.delete).toHaveBeenCalled();
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should call complete controller', async () => {
      // Arrange
      tasksController.complete.mockImplementation((req, res) => {
        res.json({ message: 'Task marked as completed' });
      });

      // Act
      const response = await request(app)
        .patch('/tasks/1/complete')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(tasksController.complete).toHaveBeenCalled();
    });
  });
});
