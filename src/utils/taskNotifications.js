import { requestNotificationPermission, onMessageListener } from '../firebase/messaging';
import { utils } from './firestoreService';

// Notification types
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNMENT: 'task_assignment',
  HIGH_PRIORITY: 'high_priority',
  TASK_DUE_TODAY: 'task_due_today',
  TASK_OVERDUE: 'task_overdue'
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium', 
  HIGH: 'High'
};

// Check if current time is within quiet hours
export const isWithinQuietHours = (quietHoursStart, quietHoursEnd) => {
  if (!quietHoursStart || !quietHoursEnd) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const startTime = parseInt(quietHoursStart.split(':')[0]) * 60 + parseInt(quietHoursStart.split(':')[1]);
  const endTime = parseInt(quietHoursEnd.split(':')[0]) * 60 + parseInt(quietHoursEnd.split(':')[1]);
  
  // Handle overnight quiet hours (e.g., 22:00 to 06:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
};

// Check if task should trigger notification
export const shouldNotifyAboutTask = (task, userEmail, notificationPreferences) => {
  // Only notify about tasks assigned to current user
  if (task.assignedTo !== userEmail) {
    return false;
  }
  
  // Check if notifications are enabled
  if (!notificationPreferences?.enabled) {
    return false;
  }
  
  // Check quiet hours
  if (notificationPreferences.quietHoursEnabled && 
      isWithinQuietHours(notificationPreferences.quietHoursStart, notificationPreferences.quietHoursEnd)) {
    return false;
  }
  
  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const lastNotified = task.lastNotified ? new Date(task.lastNotified) : null;
  
  // Check if we've already notified recently (within 4 hours)
  if (lastNotified) {
    const hoursSinceLastNotification = (now - lastNotified) / (1000 * 60 * 60);
    if (hoursSinceLastNotification < 4) {
      return false;
    }
  }
  
  // Check specific notification types
  if (task.priority === PRIORITY_LEVELS.HIGH && notificationPreferences.highPriorityTaskAlerts) {
    return true;
  }
  
  if (dueDate) {
    const isDueToday = dueDate.toDateString() === now.toDateString();
    const isOverdue = dueDate < now;
    
    if (isDueToday && notificationPreferences.taskDueDateAlerts) {
      return true;
    }
    
    if (isOverdue && notificationPreferences.taskDueDateAlerts) {
      return true;
    }
  }
  
  // Check task assignment notifications
  if (notificationPreferences.taskAssignmentAlerts && !lastNotified) {
    return true;
  }
  
  return false;
};

// Create notification message
export const createNotificationMessage = (task, notificationType) => {
  const baseMessage = {
    title: '',
    body: '',
    icon: '/favicon.ico',
    badge: '/badge-icon.png',
    data: {
      taskId: task.id,
      notificationType,
      click_action: '/tasks'
    }
  };
  
  switch (notificationType) {
    case NOTIFICATION_TYPES.TASK_ASSIGNMENT:
      baseMessage.title = 'New Task Assigned';
      baseMessage.body = `You have been assigned: "${task.title}"`;
      break;
      
    case NOTIFICATION_TYPES.HIGH_PRIORITY:
      baseMessage.title = 'High Priority Task';
      baseMessage.body = `High priority task due: "${task.title}"`;
      break;
      
    case NOTIFICATION_TYPES.TASK_DUE_TODAY:
      baseMessage.title = 'Task Due Today';
      baseMessage.body = `Task due today: "${task.title}"`;
      break;
      
    case NOTIFICATION_TYPES.TASK_OVERDUE:
      baseMessage.title = 'Task Overdue';
      baseMessage.body = `Overdue task: "${task.title}"`;
      break;
      
    default:
      baseMessage.title = 'Task Reminder';
      baseMessage.body = `Task reminder: "${task.title}"`;
  }
  
  return baseMessage;
};

// Send browser notification
export const sendBrowserNotification = async (message) => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return false;
    }
    
    // Check permission
    if (Notification.permission === 'granted') {
      const notification = new Notification(message.title, {
        body: message.body,
        icon: message.icon,
        badge: message.badge,
        data: message.data,
        tag: `task-${message.data.taskId}`, // Prevent duplicate notifications
        requireInteraction: message.data.notificationType === NOTIFICATION_TYPES.HIGH_PRIORITY
      });
      
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to tasks page
        window.location.href = message.data.click_action;
      };
      
      console.log('✅ Browser notification sent:', message.title);
      return true;
    } else {
      console.log('❌ Notification permission not granted');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending browser notification:', error);
    return false;
  }
};

// Send FCM notification (placeholder for server-side implementation)
export const sendFCMNotification = async (userToken, message) => {
  try {
    // This would typically be done server-side
    // For now, we'll just log the attempt
    console.log('📱 FCM notification would be sent to token:', userToken);
    console.log('📱 FCM message:', message);
    
    // In a real implementation, you would:
    // 1. Send the notification to your backend
    // 2. Backend would use Firebase Admin SDK to send FCM
    // 3. FCM would deliver to the user's device
    
    return true;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    return false;
  }
};

// Main notification checker function
export const checkTaskNotifications = async (tasks, userEmail, notificationPreferences, userToken = null) => {
  try {
    console.log('🔔 Checking task notifications for user:', userEmail);
    console.log('🔔 Notification preferences:', notificationPreferences);
    
    if (!tasks || !Array.isArray(tasks)) {
      console.log('❌ No tasks to check');
      return { checked: 0, notified: 0, errors: [] };
    }
    
    let checkedCount = 0;
    let notifiedCount = 0;
    const errors = [];
    
    for (const task of tasks) {
      checkedCount++;
      
      try {
        if (shouldNotifyAboutTask(task, userEmail, notificationPreferences)) {
          console.log('🔔 Task needs notification:', task.title);
          
          // Determine notification type
          let notificationType = NOTIFICATION_TYPES.TASK_ASSIGNMENT;
          
          if (task.priority === PRIORITY_LEVELS.HIGH) {
            notificationType = NOTIFICATION_TYPES.HIGH_PRIORITY;
          } else if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            
            if (dueDate < now) {
              notificationType = NOTIFICATION_TYPES.TASK_OVERDUE;
            } else if (dueDate.toDateString() === now.toDateString()) {
              notificationType = NOTIFICATION_TYPES.TASK_DUE_TODAY;
            }
          }
          
          // Create notification message
          const message = createNotificationMessage(task, notificationType);
          
          // Send browser notification
          const browserSuccess = await sendBrowserNotification(message);
          
          // Send FCM notification if token available
          let fcmSuccess = false;
          if (userToken) {
            fcmSuccess = await sendFCMNotification(userToken, message);
          }
          
          if (browserSuccess || fcmSuccess) {
            notifiedCount++;
            console.log('✅ Notification sent for task:', task.title);
          }
        }
      } catch (error) {
        console.error('❌ Error processing task notification:', error);
        errors.push({
          taskId: task.id,
          taskTitle: task.title,
          error: error.message
        });
      }
    }
    
    console.log(`🔔 Notification check complete: ${checkedCount} checked, ${notifiedCount} notified`);
    
    return {
      checked: checkedCount,
      notified: notifiedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Error in checkTaskNotifications:', error);
    return {
      checked: 0,
      notified: 0,
      errors: [{ error: error.message }]
    };
  }
};

// Request notification permission and get token
export const initializeNotifications = async () => {
  try {
    console.log('🔔 Initializing notifications...');
    
    const token = await requestNotificationPermission();
    
    if (token) {
      console.log('✅ Notification permission granted, token obtained');
      return { success: true, token };
    } else {
      console.log('❌ Failed to get notification permission or token');
      return { success: false, token: null };
    }
  } catch (error) {
    console.error('❌ Error initializing notifications:', error);
    return { success: false, token: null, error: error.message };
  }
};

// Test function to create a test task
export const createTestTask = (userEmail) => {
  const now = new Date();
  const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Due tomorrow
  
  return {
    id: `test-${Date.now()}`,
    title: 'Test Task for Notifications',
    description: 'This is a test task to verify notification functionality',
    assignedTo: userEmail,
    priority: PRIORITY_LEVELS.HIGH,
    dueDate: dueDate.toISOString(),
    createdBy: userEmail,
    createdAt: now.toISOString(),
    status: 'pending',
    lastNotified: null
  };
};

// Enhanced test function for timezone testing
export const createTimezoneTestTasks = (userEmail) => {
  const now = new Date();
  const tasks = [];
  
  // Task 1: Due today (should trigger notification)
  const todayTask = {
    id: `timezone-test-today-${Date.now()}`,
    title: 'Timezone Test - Due Today',
    description: 'This task is due today and should trigger a notification',
    assignedTo: userEmail,
    priority: PRIORITY_LEVELS.HIGH,
    dueDate: now.toISOString(),
    createdBy: userEmail,
    createdAt: now.toISOString(),
    status: 'pending',
    lastNotified: null
  };
  
  // Task 2: High priority (should trigger notification regardless of due date)
  const highPriorityTask = {
    id: `timezone-test-high-${Date.now()}`,
    title: 'Timezone Test - High Priority',
    description: 'This is a high priority task that should trigger notification',
    assignedTo: userEmail,
    priority: PRIORITY_LEVELS.HIGH,
    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
    createdBy: userEmail,
    createdAt: now.toISOString(),
    status: 'pending',
    lastNotified: null
  };
  
  // Task 3: Due tomorrow (should not trigger notification unless high priority)
  const tomorrowTask = {
    id: `timezone-test-tomorrow-${Date.now()}`,
    title: 'Timezone Test - Due Tomorrow',
    description: 'This task is due tomorrow and should not trigger notification',
    assignedTo: userEmail,
    priority: PRIORITY_LEVELS.MEDIUM,
    dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    createdBy: userEmail,
    createdAt: now.toISOString(),
    status: 'pending',
    lastNotified: null
  };
  
  tasks.push(todayTask, highPriorityTask, tomorrowTask);
  return tasks;
};

// Update task's lastNotified timestamp
export const updateTaskLastNotified = async (taskId, farmCode) => {
  try {
    // This would update the task in Firestore
    // For now, we'll just log the update
    console.log('📝 Updating lastNotified for task:', taskId);
    
    // In a real implementation, you would:
    // 1. Get the current farm data
    // 2. Find the task and update lastNotified
    // 3. Save back to Firestore
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating task lastNotified:', error);
    return { success: false, error: error.message };
  }
}; 