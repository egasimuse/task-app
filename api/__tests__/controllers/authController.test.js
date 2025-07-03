const authController = require('../../controllers/authController');
const { mockDb, mockBcrypt, mockJwt } = require('../setup');

describe('Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      mockDb.execute
        .mockResolvedValueOnce([[]]) // No existing user
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert result

      mockBcrypt.hash.mockResolvedValue('hashedpassword');
      mockJwt.sign.mockReturnValue('mock_jwt_token');

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockJwt.sign).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        token: 'mock_jwt_token',
        user: { id: 1, username: 'testuser', email: 'test@example.com' }
      });
    });

    it('should return error if user already exists', async () => {
      // Arrange
      mockReq.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      };

      mockDb.execute.mockResolvedValueOnce([[{ id: 1 }]]); // Existing user

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User already exists'
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      mockDb.execute.mockRejectedValue(new Error('Database error'));

      // Act
      await authController.register(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user'
      };

      mockDb.execute.mockResolvedValueOnce([[mockUser]]);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock_jwt_token');

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['test@example.com']
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockJwt.sign).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'mock_jwt_token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        }
      });
    });

    it('should return error for invalid email', async () => {
      // Arrange
      mockReq.body = {
        email: 'invalid@example.com',
        password: 'password123'
      };

      mockDb.execute.mockResolvedValueOnce([[]]);

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid credentials'
      });
    });

    it('should return error for invalid password', async () => {
      // Arrange
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user'
      };

      mockDb.execute.mockResolvedValueOnce([[mockUser]]);
      mockBcrypt.compare.mockResolvedValue(false);

      // Act
      await authController.login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid credentials'
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      mockReq.user = mockUser;

      // Act
      await authController.validateToken(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        valid: true,
        user: mockUser
      });
    });
  });
});
