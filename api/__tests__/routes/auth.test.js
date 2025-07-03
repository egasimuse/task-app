const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');

// Mock the auth controller
jest.mock('../../controllers/authController', () => ({
  register: jest.fn(),
  login: jest.fn(),
  validateToken: jest.fn()
}));

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 1, username: 'testuser', email: 'test@example.com' };
    next();
  })
}));

const authController = require('../../controllers/authController');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should call register controller', async () => {
      // Arrange
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ message: 'User created successfully' });
      });

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(authController.register).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should call login controller', async () => {
      // Arrange
      authController.login.mockImplementation((req, res) => {
        res.json({ message: 'Login successful', token: 'mock_token' });
      });

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
    });
  });

  describe('GET /auth/validate', () => {
    it('should call validateToken controller with authentication', async () => {
      // Arrange
      authController.validateToken.mockImplementation((req, res) => {
        res.json({ valid: true, user: req.user });
      });

      // Act
      const response = await request(app)
        .get('/auth/validate')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(authController.validateToken).toHaveBeenCalled();
    });
  });
});
