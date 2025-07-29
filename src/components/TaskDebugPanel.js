import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  RefreshCw, 
  Eye, 
  Bell, 
  User, 
  Database,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import taskService from '../utils/taskService';
import { requestNotificationPermission } from '../firebase/messaging';
import { utils } from '../utils/firestoreService';

const TaskDebugPanel = ({ isOpen, onClose }) => {
  const { user, farm, farmData } = useAuth();
  const [debugData, setDebugData] = useState({
    userInfo: {},
    allTasks: [],
    userTasks: [],
    fcmToken: null,
    notificationPreferences: {},
    firestoreErrors: []
  });
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Load debug data
  const loadDebugData = async () => {
    if (!user || !farm) return;
    
    setLoading(true);
    console.log('🐛 DEBUG PANEL: Loading debug data...');
    
    try {
      const debugInfo = {
        userInfo: {
          email: user.email,
          uid: user.uid,
          displayName: user.displayName,
          farmCode: user.farmCode,
          role: user.role || 'unknown',
          deviceType: (() => {
            const userAgent = navigator.userAgent;
            const platform = navigator.platform;
            const maxTouchPoints = navigator.maxTouchPoints;
            
            console.log('🔍 Device Detection Debug:');
            console.log('🔍 User Agent:', userAgent);
            console.log('🔍 Platform:', platform);
            console.log('🔍 Max Touch Points:', maxTouchPoints);
            
            if (/iPad|iPhone|iPod/.test(userAgent)) {
              return 'iOS';
            } else if (platform === 'MacIntel' && maxTouchPoints > 1) {
              return 'iOS (iPad)';
            } else if (/Android/.test(userAgent)) {
              return 'Android';
            } else {
              return 'Desktop';
            }
          })()
        },
        allTasks: [],
        userTasks: [],
        fcmToken: null,
        notificationPreferences: farmData?.profileData?.notifications || {},
        firestoreErrors: []
      };

      // Get FCM token
      try {
        const token = await requestNotificationPermission();
        debugInfo.fcmToken = token;
        console.log('🐛 DEBUG PANEL: FCM token:', token);
      } catch (error) {
        console.error('🐛 DEBUG PANEL: FCM token error:', error);
        debugInfo.firestoreErrors.push(`FCM Token Error: ${error.message}`);
      }

      // Get all tasks for debugging
      try {
        const allTasksResult = await taskService.getAllTasks();
        if (allTasksResult.success) {
          debugInfo.allTasks = allTasksResult.tasks;
          console.log('🐛 DEBUG PANEL: All tasks:', allTasksResult.tasks);
        } else {
          debugInfo.firestoreErrors.push(`All Tasks Error: ${allTasksResult.error}`);
        }
      } catch (error) {
        console.error('🐛 DEBUG PANEL: All tasks error:', error);
        debugInfo.firestoreErrors.push(`All Tasks Error: ${error.message}`);
      }

      // Check if user document exists in users collection
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          debugInfo.userInfo.userDocument = {
            exists: true,
            fcmTokens: userData.fcmTokens || [],
            notificationPreferences: userData.notificationPreferences || {},
            email: userData.email,
            farmCode: userData.farmCode
          };
          console.log('🐛 DEBUG PANEL: User document found:', userData);
        } else {
          debugInfo.userInfo.userDocument = {
            exists: false,
            error: 'User document not found in users collection'
          };
          debugInfo.firestoreErrors.push('User document not found in users collection');
          console.log('🐛 DEBUG PANEL: User document not found in users collection');
        }
      } catch (error) {
        console.error('🐛 DEBUG PANEL: User document check error:', error);
        debugInfo.firestoreErrors.push(`User Document Error: ${error.message}`);
      }

      // Get user-specific tasks
      try {
        const userTasksResult = await taskService.getUserTasks(user.email, user.farmCode);
        if (userTasksResult.success) {
          debugInfo.userTasks = userTasksResult.tasks;
          console.log('🐛 DEBUG PANEL: User tasks:', userTasksResult.tasks);
        } else {
          debugInfo.firestoreErrors.push(`User Tasks Error: ${userTasksResult.error}`);
        }
      } catch (error) {
        console.error('🐛 DEBUG PANEL: User tasks error:', error);
        debugInfo.firestoreErrors.push(`User Tasks Error: ${error.message}`);
      }

      setDebugData(debugInfo);
      setLastRefresh(new Date());
      console.log('🐛 DEBUG PANEL: Debug data loaded successfully');
      
    } catch (error) {
      console.error('🐛 DEBUG PANEL: Error loading debug data:', error);
      setDebugData(prev => ({
        ...prev,
        firestoreErrors: [...prev.firestoreErrors, `General Error: ${error.message}`]
      }));
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when user/farm changes
  useEffect(() => {
    if (isOpen && user && farm) {
      loadDebugData();
    }
  }, [isOpen, user, farm]);

  // Test notification function
  const testNotification = async () => {
    try {
      console.log('🐛 DEBUG PANEL: Testing notification...');
      
      if (!debugData.fcmToken) {
        alert('No FCM token available. Please check notification permissions.');
        return;
      }

      // Create a test notification
      const testMessage = {
        notification: {
          title: 'Test Notification',
          body: 'This is a test notification from the debug panel',
          icon: '/favicon.ico'
        },
        data: {
          type: 'test_notification',
          timestamp: new Date().toISOString()
        }
      };

      // Send to self (this would normally go through FCM)
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(testMessage.notification.title, {
            body: testMessage.notification.body,
            icon: testMessage.notification.icon
          });
          console.log('🐛 DEBUG PANEL: Test notification sent successfully');
        }
      }
    } catch (error) {
      console.error('🐛 DEBUG PANEL: Test notification error:', error);
      alert(`Test notification failed: ${error.message}`);
    }
  };

  // Create test task function
  const createTestTask = async () => {
    try {
      console.log('🌐 LIVE SITE: DEBUG PANEL - Creating test task...');
      console.log('🌐 LIVE SITE: DEBUG PANEL - User:', user);
      console.log('🌐 LIVE SITE: DEBUG PANEL - User email:', user?.email);
      console.log('🌐 LIVE SITE: DEBUG PANEL - User farm code:', user?.farmCode);
      
      const testTask = {
        title: `Test Task - ${new Date().toLocaleString()}`,
        description: 'This is a test task created from the debug panel',
        assignedTo: user.email,
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      };

      console.log('🌐 LIVE SITE: DEBUG PANEL - Test task data:', testTask);
      console.log('🌐 LIVE SITE: DEBUG PANEL - About to call taskService.createTask...');

      const result = await taskService.createTask(testTask, user);
      
      console.log('🌐 LIVE SITE: DEBUG PANEL - taskService.createTask result:', result);
      
      if (result.success) {
        console.log('🌐 LIVE SITE: DEBUG PANEL - Test task created successfully');
        alert('Test task created successfully!');
        loadDebugData(); // Refresh the data
      } else {
        console.error('🌐 LIVE SITE: DEBUG PANEL - Test task creation failed:', result.error);
        alert(`Test task creation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('🌐 LIVE SITE: DEBUG PANEL - Test task creation error:', error);
      console.error('🌐 LIVE SITE: DEBUG PANEL - Error code:', error.code);
      console.error('🌐 LIVE SITE: DEBUG PANEL - Error message:', error.message);
      console.error('🌐 LIVE SITE: DEBUG PANEL - Error stack:', error.stack);
      alert(`Test task creation error: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Bug className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Task Sync Debug Panel</h3>
              <p className="text-sm text-slate-600">Debug task synchronization issues</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDebugData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-slate-600 mt-2">Loading debug data...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>User Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Email:</span>
                    <p className="text-blue-900">{debugData.userInfo.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">UID:</span>
                    <p className="text-blue-900 font-mono text-xs">{debugData.userInfo.uid}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Farm Code:</span>
                    <p className="text-blue-900">{debugData.userInfo.farmCode}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Role:</span>
                    <p className="text-blue-900">{debugData.userInfo.role}</p>
                  </div>
                </div>
              </div>

              {/* FCM Token Status */}
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>FCM Token Status</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {debugData.fcmToken ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">
                      {debugData.fcmToken ? 'Token Available' : 'No Token'}
                    </span>
                  </div>
                  {debugData.fcmToken && (
                    <p className="text-xs font-mono text-green-700 break-all">
                      {debugData.fcmToken.substring(0, 50)}...
                    </p>
                  )}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-semibold text-purple-900 mb-3">Notification Preferences</h4>
                <pre className="text-xs text-purple-700 bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(debugData.notificationPreferences, null, 2)}
                </pre>
              </div>

              {/* Tasks Summary */}
              <div className="bg-orange-50 rounded-xl p-4">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>Tasks Summary</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-orange-700">Total Tasks in Database:</span>
                    <p className="text-orange-900 font-bold">{debugData.allTasks.length}</p>
                  </div>
                  <div>
                    <span className="font-medium text-orange-700">Tasks Assigned to You:</span>
                    <p className="text-orange-900 font-bold">{debugData.userTasks.length}</p>
                  </div>
                </div>
              </div>

              {/* All Tasks */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-3">All Tasks in Database</h4>
                {debugData.allTasks.length === 0 ? (
                  <p className="text-slate-600 text-sm">No tasks found in database</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {debugData.allTasks.map((task, index) => (
                      <div key={task.id || index} className="bg-white p-2 rounded border text-xs">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-slate-600">
                          Assigned to: {task.assignedTo} | Farm: {task.farmCode} | Status: {task.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Tasks */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Your Tasks</h4>
                {debugData.userTasks.length === 0 ? (
                  <p className="text-blue-600 text-sm">No tasks assigned to you</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {debugData.userTasks.map((task, index) => (
                      <div key={task.id || index} className="bg-white p-2 rounded border text-xs">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-slate-600">
                          Priority: {task.priority} | Due: {task.dueDate} | Status: {task.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Errors */}
              {debugData.firestoreErrors.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4">
                  <h4 className="font-semibold text-red-900 mb-3">Errors</h4>
                  <div className="space-y-2">
                    {debugData.firestoreErrors.map((error, index) => (
                      <div key={index} className="text-red-700 text-sm bg-red-100 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Debug Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={createTestTask}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Create Test Task
                  </button>
                  <button
                    onClick={testNotification}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Test Notification
                  </button>
                  <button
                    onClick={loadDebugData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Reload Data
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Check service worker
                        if ('serviceWorker' in navigator) {
                          const registration = await navigator.serviceWorker.getRegistration();
                          if (registration) {
                            console.log('🔔 DEBUG: Service worker registered:', registration);
                            alert('Service worker is registered and active');
                          } else {
                            console.log('🔔 DEBUG: No service worker registration found');
                            alert('No service worker registration found');
                          }
                        } else {
                          alert('Service workers not supported in this browser');
                        }
                      } catch (error) {
                        console.error('🔔 DEBUG: Service worker check error:', error);
                        alert(`Error checking service worker: ${error.message}`);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Check Service Worker
                  </button>
                  <button
                    onClick={() => {
                      try {
                        // Check notification permission
                        if ('Notification' in window) {
                          const permission = Notification.permission;
                          console.log('🔔 DEBUG: Current notification permission:', permission);
                          alert(`Current notification permission: ${permission}`);
                        } else {
                          alert('Notifications not supported in this browser');
                        }
                      } catch (error) {
                        console.error('🔔 DEBUG: Notification permission check error:', error);
                        alert(`Error checking notification permission: ${error.message}`);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Check Notifications
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('🔔 DEBUG: Starting FCM token request...');
                        
                        // Check notification permission first
                        const permission = await Notification.requestPermission();
                        console.log('🔔 DEBUG: Notification permission:', permission);
                        
                        if (permission !== 'granted') {
                          alert(`Notification permission is: ${permission}. Please allow notifications in your browser settings.`);
                          return;
                        }
                        
                        // Try to get FCM token
                        console.log('🔔 DEBUG: Getting FCM token...');
                        const token = await requestNotificationPermission();
                        console.log('🔔 DEBUG: FCM token result:', token);
                        
                        if (token && user?.uid) {
                          console.log('🔔 DEBUG: Storing FCM token...');
                          const result = await utils.storeFCMToken(user.uid, token);
                          console.log('🔔 DEBUG: Store result:', result);
                          
                          if (result.success) {
                            alert('FCM token stored successfully!');
                            loadDebugData(); // Refresh the data
                          } else {
                            alert(`Failed to store FCM token: ${result.error}`);
                          }
                        } else {
                          if (!token) {
                            alert('FCM token request failed. Check browser console for details.');
                          } else {
                            alert('User not authenticated (no UID)');
                          }
                        }
                      } catch (error) {
                        console.error('🔔 DEBUG: FCM token error:', error);
                        alert(`Error storing FCM token: ${error.message}`);
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    Store FCM Token
                  </button>
                </div>
              </div>

              {/* Last Refresh */}
              {lastRefresh && (
                <div className="text-center text-xs text-slate-500">
                  Last refreshed: {lastRefresh.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDebugPanel; 