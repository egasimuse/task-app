import React from 'react';
import './TaskList.css';

const TaskList = ({ tasks, users, currentUser, onEdit, onComplete, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  const getStatusClass = (status) => {
    return `status-${status.replace('_', '-')}`;
  };

  const canEditTask = (task) => {
    // Admins can edit any task, users can only edit tasks they created
    return currentUser.role === 'admin' || task.created_by === currentUser.id;
  };

  const canDeleteTask = (task) => {
    // Admins can delete any task, users can only delete tasks they created
    return currentUser.role === 'admin' || task.created_by === currentUser.id;
  };

  const canCompleteTask = (task) => {
    // Users can complete tasks they created or are assigned to, admins can complete any task
    return currentUser.role === 'admin' || 
           task.created_by === currentUser.id || 
           task.assigned_to === currentUser.id;
  };

  if (tasks.length === 0) {
    return (
      <div className="no-tasks">
        <p>No tasks found. Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task.id} className={`task-card ${getStatusClass(task.status)}`}>
          <div className="task-header">
            <h3 className="task-title">{task.title}</h3>
            <div className="task-meta">
              <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`status-badge ${getStatusClass(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          <div className="task-details">
            <div className="task-info">
              <div className="info-item">
                <strong>Created by:</strong> {task.creator_name}
              </div>
              <div className="info-item">
                <strong>Assigned to:</strong> {task.assignee_name || 'Unassigned'}
              </div>
              {task.due_date && (
                <div className="info-item">
                  <strong>Due:</strong> {formatDate(task.due_date)}
                </div>
              )}
              <div className="info-item">
                <strong>Created:</strong> {formatDate(task.created_at)}
              </div>
            </div>
          </div>

          <div className="task-actions">
            {canCompleteTask(task) && task.status !== 'completed' && (
              <button
                className="complete-btn"
                onClick={() => onComplete(task.id)}
                title="Mark as completed"
              >
                Complete
              </button>
            )}
            
            {canEditTask(task) && (
              <button
                className="edit-btn"
                onClick={() => onEdit(task)}
                title="Edit task"
              >
                Edit
              </button>
            )}
            
            {canDeleteTask(task) && (
              <button
                className="delete-btn"
                onClick={() => onDelete(task.id)}
                title="Delete task"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
