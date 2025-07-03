const tasksController = require('../../controllers/tasksController');
const { mockDb } = require('../setup');

// Mock date utils
jest.mock('../../utils/dateUtils', () => ({
  formatDateForMySQL: jest.fn((date) => date)
}));

describe('Tasks Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: { id: 1, username: 'testuser' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all tasks successfully', async () => {
      // Arrange
      const mockTasks = [
        {
          id: 1,
          title: 'Test Task 1',
          description: 'Description 1',
          status: 'pending',
          priority: 'medium',
          creator_name: 'testuser',
          assignee_name: 'assignee1'
        },
        {
          id: 2,
          title: 'Test Task 2',
          description: 'Description 2',
          status: 'completed',
          priority: 'high',
          creator_name: 'testuser',
          assignee_name: 'assignee2'
        }
      ];

      mockDb.execute.mockResolvedValue([mockTasks]);

      // Act
      await tasksController.getAll(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT t.*'));
      expect(mockRes.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should handle database errors', async () => {
      // Arrange
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      // Act
      await tasksController.getAll(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('getAssigned', () => {
    it('should return tasks assigned to user', async () => {
      // Arrange
      const mockTasks = [
        {
          id: 1,
          title: 'Assigned Task',
          description: 'Task assigned to user',
          status: 'in_progress',
          priority: 'high',
          assigned_to: 1,
          creator_name: 'admin',
          assignee_name: 'testuser'
        }
      ];

      mockDb.execute.mockResolvedValue([mockTasks]);

      // Act
      await tasksController.getAssigned(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.assigned_to = ?'),
        [1]
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockTasks);
    });
  });

  describe('getById', () => {
    it('should return task by ID successfully', async () => {
      // Arrange
      mockReq.params.id = '1';
      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'medium',
        creator_name: 'testuser',
        assignee_name: 'assignee1'
      };

      mockDb.execute.mockResolvedValue([[mockTask]]);

      // Act
      await tasksController.getById(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.id = ?'),
        ['1']
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockTask);
    });

    it('should return 404 if task not found', async () => {
      // Arrange
      mockReq.params.id = '999';
      mockDb.execute.mockResolvedValue([[]]);

      // Act
      await tasksController.getById(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Task not found'
      });
    });
  });

  describe('create', () => {
    it('should create task successfully', async () => {
      // Arrange
      mockReq.body = {
        title: 'New Task',
        description: 'New task description',
        assigned_to: 2,
        priority: 'medium',
        due_date: '2025-12-31'
      };

      mockDb.execute
        .mockResolvedValueOnce([{ insertId: 3 }]) // First call to insert task
        .mockResolvedValueOnce([[{ // Second call to get created task
          id: 3,
          title: 'New Task',
          description: 'New task description',
          assigned_to: 2,
          created_by: 1,
          priority: 'medium',
          due_date: '2025-12-31',
          status: 'pending'
        }]]);

      // Act
      await tasksController.create(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Task created successfully',
        task: expect.objectContaining({
          id: 3,
          title: 'New Task'
        })
      });
    });

    it('should handle missing required fields', async () => {
      // Arrange
      mockReq.body = {
        description: 'Missing title'
      };

      // Act
      await tasksController.create(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Title is required'
      });
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      // Arrange
      mockReq.params.id = '1';
      mockReq.user = { id: 1, role: 'admin' }; // Admin can edit any task
      mockReq.body = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
        assigned_to: 3,
        due_date: '2025-12-31'
      };

      // Mock existing task
      const existingTask = {
        id: 1,
        title: 'Original Task',
        created_by: 2,
        assigned_to: 1
      };

      mockDb.execute
        .mockResolvedValueOnce([[existingTask]]) // First call to check if task exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Second call to update
        .mockResolvedValueOnce([[existingTask]]); // Third call to get updated task

      // Act
      await tasksController.update(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Task updated successfully',
        task: existingTask
      });
    });

    it('should return 404 if task not found', async () => {
      // Arrange
      mockReq.params.id = '999';
      mockReq.body = { title: 'Updated Task' };
      mockDb.execute.mockResolvedValue([[]]);

      // Act
      await tasksController.update(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Task not found'
      });
    });
  });

  describe('delete', () => {
    it('should delete task successfully', async () => {
      // Arrange
      mockReq.params.id = '1';
      mockReq.user = { id: 1, role: 'admin' }; // Admin can delete any task
      
      // Mock existing task
      const existingTask = {
        id: 1,
        title: 'Task to delete',
        created_by: 2
      };

      mockDb.execute
        .mockResolvedValueOnce([[existingTask]]) // First call to check if task exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Second call to delete

      // Act
      await tasksController.delete(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Task deleted successfully'
      });
    });

    it('should return 404 if task not found', async () => {
      // Arrange
      mockReq.params.id = '999';
      mockDb.execute.mockResolvedValue([[]]);

      // Act
      await tasksController.delete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Task not found'
      });
    });
  });

  describe('complete', () => {
    it('should mark task as completed successfully', async () => {
      // Arrange
      mockReq.params.id = '1';
      mockReq.user = { id: 1, role: 'admin' }; // Admin can complete any task
      
      // Mock existing task
      const existingTask = {
        id: 1,
        title: 'Task to complete',
        created_by: 2,
        status: 'pending'
      };

      mockDb.execute
        .mockResolvedValueOnce([[existingTask]]) // First call to check if task exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Second call to update status
        .mockResolvedValueOnce([[{ ...existingTask, status: 'completed' }]]); // Third call to get updated task

      // Act
      await tasksController.complete(mockReq, mockRes);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledTimes(3);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Task marked as completed',
        task: expect.objectContaining({
          id: 1,
          status: 'completed'
        })
      });
    });

    it('should return 404 if task not found', async () => {
      // Arrange
      mockReq.params.id = '999';
      mockDb.execute.mockResolvedValue([[]]);

      // Act
      await tasksController.complete(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Task not found'
      });
    });
  });
});
