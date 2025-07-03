const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mock all dependencies
jest.mock('../config/database');
jest.mock('../controllers/authController');
jest.mock('../controllers/tasksController');
jest.mock('../controllers/usersController');
jest.mock('../middleware/auth');

describe('API Server Integration', () => {
  let app;
  let authController, tasksController, usersController, authMiddleware;

  beforeAll(() => {
    // Get mocked controllers
    authController = require('../controllers/authController');
    tasksController = require('../controllers/tasksController');
    usersController = require('../controllers/usersController');
    authMiddleware = require('../middleware/auth');

    // Mock controller methods
    authController.register = jest.fn((req, res) => res.status(201).json({ message: 'User created' }));
    authController.login = jest.fn((req, res) => res.json({ token: 'mock_token' }));
    authController.validateToken = jest.fn((req, res) => res.json({ valid: true }));
    
    tasksController.getAll = jest.fn((req, res) => res.json([]));
    tasksController.getAssigned = jest.fn((req, res) => res.json([]));
    tasksController.getById = jest.fn((req, res) => res.json({}));
    tasksController.create = jest.fn((req, res) => res.status(201).json({ id: 1 }));
    tasksController.update = jest.fn((req, res) => res.json({ message: 'Updated' }));
    tasksController.delete = jest.fn((req, res) => res.json({ message: 'Deleted' }));
    tasksController.complete = jest.fn((req, res) => res.json({ message: 'Completed' }));
    
    usersController.getAll = jest.fn((req, res) => res.json([]));
    usersController.getById = jest.fn((req, res) => res.json({}));
    usersController.create = jest.fn((req, res) => res.status(201).json({ id: 1 }));
    usersController.update = jest.fn((req, res) => res.json({ message: 'Updated' }));
    usersController.delete = jest.fn((req, res) => res.json({ message: 'Deleted' }));

    // Mock auth middleware to pass through
    authMiddleware.authenticateToken = jest.fn((req, res, next) => {
      req.user = { id: 1, role: 'admin' };
      next();
    });

    // Create a test app similar to server.js
    app = express();
    app.use(cors());
    app.use(express.json());

    // Import routes after mocking
    const authRoutes = require('../routes/auth');
    const tasksRoutes = require('../routes/tasks');
    const usersRoutes = require('../routes/users');

    app.use('/api/auth', authRoutes);
    app.use('/api/tasks', tasksRoutes);
    app.use('/api/users', usersRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  });

  describe('Health Check', () => {
    it('should return OK status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON request body', async () => {
      // Mock the auth controller to check if body is parsed
      const authController = require('../controllers/authController');
      authController.register.mockImplementation((req, res) => {
        res.json({ receivedBody: req.body });
      });

      const testData = { username: 'test', email: 'test@example.com' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(testData)
        .expect(200);

      expect(response.body.receivedBody).toEqual(testData);
    });
  });

  describe('Route Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Route not found' });
    });
  });

  describe('Error Handling', () => {
    it('should handle controller errors', async () => {
      // Mock a controller to throw an error
      const authController = require('../controllers/authController');
      authController.login.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Route Structure', () => {
    it('should have auth routes mounted at /api/auth', async () => {
      const authController = require('../controllers/authController');
      authController.register.mockImplementation((req, res) => {
        res.json({ route: 'auth/register' });
      });

      await request(app)
        .post('/api/auth/register')
        .expect(200);

      expect(authController.register).toHaveBeenCalled();
    });

    it('should have tasks routes mounted at /api/tasks', async () => {
      const tasksController = require('../controllers/tasksController');
      tasksController.getAll.mockImplementation((req, res) => {
        res.json({ route: 'tasks' });
      });

      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(tasksController.getAll).toHaveBeenCalled();
    });

    it('should have users routes mounted at /api/users', async () => {
      const usersController = require('../controllers/usersController');
      usersController.getAll.mockImplementation((req, res) => {
        res.json({ route: 'users' });
      });

      await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(usersController.getAll).toHaveBeenCalled();
    });
  });
});
