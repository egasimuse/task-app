const db = require('../config/database');
const { formatDateForMySQL } = require('../utils/dateUtils');

const tasksController = {
  // Get all tasks
  async getAll(req, res) {
    try {
      const [tasks] = await db.execute(`
        SELECT t.*, 
               creator.username as creator_name,
               assignee.username as assignee_name
        FROM tasks t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        ORDER BY t.created_at DESC
      `);
      
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get tasks assigned to the authenticated user
  async getAssigned(req, res) {
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
  },

  // Get a single task by ID
  async getById(req, res) {
    try {
      const taskId = req.params.id;
      
      const [tasks] = await db.execute(`
        SELECT t.*, 
               creator.username as creator_name,
               assignee.username as assignee_name
        FROM tasks t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.id = ?
      `, [taskId]);
      
      if (tasks.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json(tasks[0]);
    } catch (error) {
      console.error('Get task by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create a new task
  async create(req, res) {
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
  },

  // Update a task
  async update(req, res) {
    try {
      const taskId = req.params.id;
      const { title, description, assigned_to, priority, due_date, status } = req.body;
      
      // Check if task exists
      const [existingTasks] = await db.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );
      
      if (existingTasks.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const task = existingTasks[0];

      // Check permissions: admins can edit any task, users can only edit their own tasks
      if (req.user.role !== 'admin' && task.created_by !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit tasks you created' });
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
  },

  // Mark task as completed
  async complete(req, res) {
    try {
      const taskId = req.params.id;
      
      // Check if task exists
      const [existingTasks] = await db.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );
      
      if (existingTasks.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const task = existingTasks[0];

      // Check permissions: users can complete tasks they created or are assigned to, admins can complete any task
      if (req.user.role !== 'admin' && task.created_by !== req.user.id && task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'You can only complete tasks you created or are assigned to' });
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
  },

  // Delete a task
  async delete(req, res) {
    try {
      const taskId = req.params.id;
      
      // Check if task exists
      const [existingTasks] = await db.execute(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );
      
      if (existingTasks.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const task = existingTasks[0];

      // Check permissions: admins can delete any task, users can only delete their own tasks
      if (req.user.role !== 'admin' && task.created_by !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete tasks you created' });
      }

      await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = tasksController;
