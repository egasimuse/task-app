// Test setup and configuration

// Mock environment variables first
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_taskdb';

// Mock implementations
const mockDb = {
  execute: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
};

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn()
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn()
};

// Mock modules at the top level to ensure they're applied before any imports
jest.mock('../config/database', () => mockDb);
jest.mock('bcryptjs', () => mockBcrypt);
jest.mock('jsonwebtoken', () => mockJwt);

// Set up global beforeEach to reset mocks
beforeEach(() => {
  jest.clearAllMocks();
});

// Export mocks for global access
module.exports = {
  mockDb,
  mockBcrypt,
  mockJwt
};
