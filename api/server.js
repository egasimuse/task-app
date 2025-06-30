const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'database',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'taskdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, username, email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertId, username, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Task Routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.execute(`
      SELECT t.*, 
             creator.username as creator_name,
             assignee.username as assignee_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.assigned_to = ? OR t.created_by = ?
      ORDER BY t.created_at DESC
    `, [req.user.id, req.user.id]);
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks assigned to the authenticated user
app.get('/api/tasks/assigned', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.execute(`
      SELECT t.*, 
             creator.username as creator_name,
             assignee.username as assignee_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.assigned_to = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    
    res.json(tasks);
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to format date for MySQL DATE column
const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
};

// Create a new task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, assigned_to, priority, due_date } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const formattedDueDate = formatDateForMySQL(due_date);

    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, assigned_to, created_by, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, assigned_to || req.user.id, req.user.id, priority || 'medium', formattedDueDate]
    );

    // Get the created task with user information
    const [tasks] = await db.execute(`
      SELECT t.*, 
             creator.username as creator_name,
             assignee.username as assignee_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Task created successfully',
      task: tasks[0]
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, assigned_to, priority, due_date, status } = req.body;
    
    // Check if task exists and user has permission
    const [existingTasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND (created_by = ? OR assigned_to = ?)',
      [taskId, req.user.id, req.user.id]
    );
    
    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or no permission' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(formatDateForMySQL(due_date));
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push('updated_at = NOW()');
    values.push(taskId);

    await db.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get the updated task with user information
    const [tasks] = await db.execute(`
      SELECT t.*, 
             creator.username as creator_name,
             assignee.username as assignee_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [taskId]);

    res.json({
      message: 'Task updated successfully',
      task: tasks[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark task as completed
app.patch('/api/tasks/:id/complete', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists and user has permission
    const [existingTasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND (created_by = ? OR assigned_to = ?)',
      [taskId, req.user.id, req.user.id]
    );
    
    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or no permission' });
    }

    await db.execute(
      'UPDATE tasks SET status = ?, completed_at = NOW(), updated_at = NOW() WHERE id = ?',
      ['completed', taskId]
    );

    // Get the updated task with user information
    const [tasks] = await db.execute(`
      SELECT t.*, 
             creator.username as creator_name,
             assignee.username as assignee_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [taskId]);

    res.json({
      message: 'Task marked as completed',
      task: tasks[0]
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists and user is the creator
    const [existingTasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND created_by = ?',
      [taskId, req.user.id]
    );
    
    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or no permission to delete' });
    }

    await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
