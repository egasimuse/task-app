import React, { useState, useEffect } from 'react';
import { tasksAPI, usersAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import './Dashboard.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all, assigned, created
  const { user, logout } = useAuth();

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await tasksAPI.create(taskData);
      setTasks([response.data.task, ...tasks]);
      setShowTaskForm(false);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const response = await tasksAPI.update(editingTask.id, taskData);
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? response.data.task : task
      ));
      setEditingTask(null);
      setShowTaskForm(false);
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await tasksAPI.complete(taskId);
      setTasks(tasks.map(task => 
        task.id === taskId ? response.data.task : task
      ));
    } catch (err) {
      setError('Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'assigned') return task.assigned_to === user.id;
    if (filter === 'created') return task.created_by === user.id;
    return true;
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Task Management Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <span className={`user-role role-${user.role}`}>
              ({user.role === 'admin' ? 'Admin' : 'User'})
            </span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-content">
        <div className="task-section">
          <div className="task-section-header">
            <div className="task-filters">
              <button 
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All Tasks
              </button>
              <button 
                className={filter === 'assigned' ? 'active' : ''}
                onClick={() => setFilter('assigned')}
              >
                Assigned to Me
              </button>
              <button 
                className={filter === 'created' ? 'active' : ''}
                onClick={() => setFilter('created')}
              >
                Created by Me
              </button>
            </div>
            <button 
              className="create-task-btn"
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
            >
              Create New Task
            </button>
          </div>

          <TaskList 
            tasks={filteredTasks}
            users={users}
            currentUser={user}
            onEdit={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
            onComplete={handleCompleteTask}
            onDelete={handleDeleteTask}
          />
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          users={users}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
