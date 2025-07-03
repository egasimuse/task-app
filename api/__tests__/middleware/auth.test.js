const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/auth');

// Mock JWT
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      mockReq.headers.authorization = 'Bearer valid_token';
      // Mock jwt.verify to call the callback with success
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid_token',
        process.env.JWT_SECRET || 'fallback_secret',
        expect.any(Function)
      );
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', () => {
      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is malformed', () => {
      // Arrange
      mockReq.headers.authorization = 'InvalidFormat';

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer invalid_token';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if token is expired', () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer expired_token';
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(expiredError, null);
      });

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle bearer token with different casing', () => {
      // Arrange
      const mockUser = { id: 1, username: 'testuser' };
      mockReq.headers.authorization = 'bearer valid_token';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid_token',
        process.env.JWT_SECRET || 'fallback_secret',
        expect.any(Function)
      );
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle authorization header with extra spaces', () => {
      // Arrange
      const mockUser = { id: 1, username: 'testuser' };
      // The middleware actually trims spaces from the authorization header
      mockReq.headers.authorization = '  Bearer  valid_token  ';
      
      // Act
      authenticateToken(mockReq, mockRes, mockNext);

      // Assert - no JWT verification should happen because the token extraction will fail
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
