const usersController = require('../../controllers/usersController');
const { mockDb } = require('../setup');

describe('Users Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 1, role: 'admin' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getAll', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com', role: 'user', created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 2, username: 'user2', email: 'user2@test.com', role: 'admin', created_at: '2023-01-02', updated_at: '2023-01-02' }
      ];
      
      mockDb.execute.mockResolvedValue([mockUsers]);

      await usersController.getAll(req, res);

      expect(mockDb.execute).toHaveBeenCalledWith(
        'SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      await usersController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
