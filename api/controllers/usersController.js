const db = require('../config/database');

const usersController = {
  // Get all users
  async getAll(req, res) {
    try {
      const [users] = await db.execute(
        'SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = usersController;
