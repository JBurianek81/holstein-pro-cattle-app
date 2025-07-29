import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  X,
  Bug
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import taskService from '../utils/taskService';
import TaskDebugPanel from './TaskDebugPanel';

const ASSIGNEES = [
  { id: 'jason', name: 'Jason Burianek' },
  { id: 'sarah', name: 'Sarah Johnson' },
  { id: 'mike', name: 'Mike Wilson' }
];

const TodaysTasks = ({ cows }) => {
  const { user, farm } = useAuth();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Local state for user tasks only
  const [userTasks, setUserTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: todayStr,
    priority: 'medium',
    assignedTo: user?.email || '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Get farm members for assignment dropdown (including owner)
  const getFarmMembers = () => {
    const members = [];
    
    // Add owner first
    if (farm?.ownerEmail && farm?.ownerName) {
      members.push({
        email: farm.ownerEmail,
        name: farm.ownerName,
        role: 'Owner'
      });
    }
    
    // Add other members
    if (farm?.members) {
      farm.members.forEach(member => {
        // Skip if this member is the owner (already added)
        if (member.email === farm.ownerEmail) return;
        
        members.push({
          email: member.email,
          name: member.name || member.displayName || member.email.split('@')[0],
          role: member.role || 'Member'
        });
      });
    }
    
    return members;
  };

  // Load user tasks from Firestore with real-time updates
  useEffect(() => {
    if (!user?.email || !user?.farmCode) {
      console.log('📝 TASKS: No user email or farm code available');
      return;
    }

    setLoading(true);
    console.log('📝 TASKS: Setting up real-time listener for user:', user.email);
    console.log('📝 TASKS: Farm code:', user.farmCode);

    const unsubscribe = taskService.loadUserTasks(user.email, user.farmCode, (tasks) => {
      console.log('📝 TASKS: Real-time update received:', tasks);
      setUserTasks(tasks);
      setLastSync(new Date());
      setLoading(false);
    });

    return () => {
      console.log('📝 TASKS: Cleaning up real-time listener');
      unsubscribe();
    };
  }, [user?.email, user?.farmCode]);

  // Get tasks for display
  const getTodaysTasks = () => {
    const tasks = [];
    
    // Show all pending tasks regardless of date
    userTasks.forEach(task => {
      if (task.status !== 'completed' && !task.completed) {
        const isOverdue = task.dueDate < todayStr;
        const daysOverdue = isOverdue ? Math.floor((today - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
        
        tasks.push({
          ...task,
          icon: isOverdue ? AlertTriangle : Calendar, // Use alert triangle for overdue tasks
          overdue: isOverdue,
          daysOverdue: daysOverdue,
          time: isOverdue 
            ? `${daysOverdue} days overdue` 
            : task.dueDate === todayStr 
              ? 'Due today' 
              : `Due ${new Date(task.dueDate).toLocaleDateString()}`
        });
      }
    });
    
    return tasks.sort((a, b) => {
      // Sort by: overdue first, then priority, then due date
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      if (a.overdue && b.overdue) {
        // Most overdue first
        return (b.daysOverdue || 0) - (a.daysOverdue || 0);
      }
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (earliest first)
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  };

  const tasks = getTodaysTasks();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getDueDateColor = (task) => {
    if (task.overdue) return 'text-red-600 font-semibold';
    if (task.dueDate === todayStr) return 'text-orange-600 font-medium';
    return 'text-slate-600';
  };

  // Add Task Modal logic
  const handleAddTask = () => {
    setFormErrors({});
    setShowAddModal(true);
    setNewTask({
      title: '',
      dueDate: todayStr,
      priority: 'medium',
      assignedTo: user?.email || '',
      description: ''
    });
  };
  
  const handleSaveTask = async (e) => {
    e.preventDefault();
    console.log('🌐 LIVE SITE: handleSaveTask called');
    console.log('🌐 LIVE SITE: New task data:', newTask);
    console.log('🌐 LIVE SITE: Current user:', user);
    console.log('🌐 LIVE SITE: User email:', user?.email);
    console.log('🌐 LIVE SITE: User farm code:', user?.farmCode);
    
    // Validate
    const errors = {};
    if (!newTask.title.trim()) errors.title = 'Task title is required';
    if (!newTask.dueDate) errors.dueDate = 'Due date is required';
    if (!newTask.priority) errors.priority = 'Priority is required';
    if (!newTask.assignedTo) errors.assignedTo = 'Assignee is required';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      console.log('🌐 LIVE SITE: About to call taskService.createTask...');
      console.log('🌐 LIVE SITE: Task data being passed:', newTask);
      console.log('🌐 LIVE SITE: User being passed:', user);
      
      const result = await taskService.createTask(newTask, user);
      
      console.log('🌐 LIVE SITE: taskService.createTask result:', result);
      
      if (result.success) {
        console.log('✅ LIVE SITE: Task created successfully:', result.taskId);
        setShowAddModal(false);
        // The real-time listener will update the tasks automatically
      } else {
        console.error('❌ TASKS: Failed to create task:', result.error);
        alert(`Failed to create task: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ LIVE SITE: Error creating task:', error);
      console.error('❌ LIVE SITE: Error code:', error.code);
      console.error('❌ LIVE SITE: Error message:', error.message);
      console.error('❌ LIVE SITE: Error stack:', error.stack);
      
      // Show detailed error to user
      let errorMessage = 'Error creating task';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firebase service unavailable. Please try again.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'You are not authenticated. Please log in again.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      alert(`Error creating task: ${errorMessage}`);
    }
  };

  const handleCompleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setTaskToComplete(task);
    setShowConfirmModal(true);
  };

  const confirmCompleteTask = async () => {
    if (taskToComplete) {
      try {
        console.log('📝 TASKS: Completing task:', taskToComplete.id);
        
        const result = await taskService.completeTask(taskToComplete.id);
        
        if (result.success) {
          console.log('✅ TASKS: Task completed successfully');
          // The real-time listener will update the tasks automatically
        } else {
          console.error('❌ TASKS: Failed to complete task:', result.error);
          alert(`Failed to complete task: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ TASKS: Error completing task:', error);
        alert(`Error completing task: ${error.message}`);
      }
    }
    setShowConfirmModal(false);
    setTaskToComplete(null);
  };

  const cancelCompleteTask = () => {
    setShowConfirmModal(false);
    setTaskToComplete(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-slate-900">Task List</h3>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            {tasks.length} incomplete tasks
          </span>
          {tasks.filter(t => t.overdue).length > 0 && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              {tasks.filter(t => t.overdue).length} overdue
            </span>
          )}
          {loading && (
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
              Loading...
            </span>
          )}
          {lastSync && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              Synced {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDebugPanel(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow"
            title="Debug Task Sync Issues"
          >
            <Bug className="w-4 h-4" />
            <span>Debug</span>
          </button>
          <button
            onClick={handleAddTask}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-900 mb-2">All Tasks Complete!</h4>
            <p className="text-slate-600">No incomplete tasks remaining.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const IconComponent = task.icon || Calendar;
              const isExpanded = expandedTaskId === task.id;
              const assigneeName = task.assignedTo || 'Unassigned';
              return (
                <div
                  key={task.id}
                  className={`flex flex-col p-4 rounded-xl border hover:bg-slate-50 transition-colors shadow-sm ${
                    task.overdue 
                      ? 'ring-2 ring-red-300 bg-red-50 border-red-200' 
                      : task.dueDate === todayStr 
                        ? 'ring-1 ring-orange-200 bg-orange-50 border-orange-200'
                        : ''
                  }`}
                  style={{ transition: 'box-shadow 0.2s, background 0.2s' }}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-4 w-5 h-5 accent-green-600"
                      checked={task.completed || task.status === 'completed'}
                      onChange={() => handleCompleteTask(task.id)}
                    />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      task.overdue 
                        ? 'bg-red-100 text-red-700 border-red-200' 
                        : getPriorityColor(task.priority)
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-900">{task.title}</h4>
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(task.priority)}
                          <span className={`text-sm ${getDueDateColor(task)}`}>
                            {task.time}
                          </span>
                          {task.overdue && (
                            <span className="ml-2 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        <span className="text-xs text-slate-500">Assigned to: {assigneeName}</span>
                        {task.createdBy && (
                          <span className="text-xs text-slate-500">Created by: {task.createdBy}</span>
                        )}
                        <span className={`text-xs ${getDueDateColor(task)}`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                  {/* Expandable details */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {isExpanded && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={() => setShowAddModal(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add New Task</h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title<span className="text-red-500 ml-1">*</span></label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.title ? 'border-red-400' : 'border-slate-300'}`}
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
                {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date<span className="text-red-500 ml-1">*</span></label>
                <input
                  type="date"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.dueDate ? 'border-red-400' : 'border-slate-300'}`}
                  value={newTask.dueDate}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                  required
                />
                {formErrors.dueDate && <p className="text-xs text-red-500 mt-1">{formErrors.dueDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority<span className="text-red-500 ml-1">*</span></label>
                <select
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.priority ? 'border-red-400' : 'border-slate-300'}`}
                  value={newTask.priority}
                  onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {formErrors.priority && <p className="text-xs text-red-500 mt-1">{formErrors.priority}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To<span className="text-red-500 ml-1">*</span></label>
                <select
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.assignedTo ? 'border-red-400' : 'border-slate-300'}`}
                  value={newTask.assignedTo}
                  onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  required
                >
                  <option value="">Select a team member</option>
                  {getFarmMembers().map(member => (
                    <option key={member.email} value={member.email}>
                      {member.name} ({member.role}) - {member.email}
                    </option>
                  ))}
                </select>
                {formErrors.assignedTo && <p className="text-xs text-red-500 mt-1">{formErrors.assignedTo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
              >
                Save Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Completion Confirmation Modal */}
      {showConfirmModal && taskToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-4">Confirm Task Completion</h3>
              <p className="text-slate-600 mb-6">
                Mark <span className="font-semibold">"{taskToComplete.name}"</span> as complete?
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelCompleteTask}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCompleteTask}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <TaskDebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />
    </div>
  );
};

export default TodaysTasks; 