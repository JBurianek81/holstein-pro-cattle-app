import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import app from '../firebase/config';

// Collection names
const COLLECTIONS = {
  TASKS: 'tasks',
  USERS: 'users',
  FARMS: 'farms'
};

// Task service for Firestore-based task management
export const taskService = {
  // Create a new task
  createTask: async (taskData, currentUser) => {
    try {
      console.log('🌐 LIVE SITE: Creating task on live Firebase site');
      console.log('🌐 LIVE SITE: Firebase app config:', app?.options);
      console.log('🌐 LIVE SITE: User auth state:', currentUser);
      console.log('🌐 LIVE SITE: Task data:', taskData);
      console.log('🌐 LIVE SITE: Firestore db instance:', db);
      console.log('🌐 LIVE SITE: Collection path:', COLLECTIONS.TASKS);
      
      // Check if user is authenticated
      if (!currentUser || !currentUser.email) {
        console.error('❌ LIVE SITE: User not authenticated or missing email');
        throw new Error('User not authenticated');
      }
      
      // Check if farm code exists
      if (!currentUser.farmCode) {
        console.error('❌ LIVE SITE: User missing farm code');
        throw new Error('User missing farm code');
      }
      
      const taskDoc = {
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority, // 'high', 'medium', 'low'
        assignedTo: taskData.assignedTo, // member email
        createdBy: currentUser.email, // owner email
        farmCode: currentUser.farmCode, // link to farm
        dueDate: taskData.dueDate, // date string
        status: 'pending',
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
        lastNotified: null
      };
      
      console.log('🌐 LIVE SITE: Task document to save:', taskDoc);
      console.log('🌐 LIVE SITE: About to call addDoc...');
      
      const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), taskDoc);
      console.log('✅ LIVE SITE: Task saved with ID:', docRef.id);
      
      return { success: true, taskId: docRef.id, task: { ...taskDoc, id: docRef.id } };
    } catch (error) {
      console.error('❌ LIVE SITE: Error saving task:', error);
      console.error('❌ LIVE SITE: Error code:', error.code);
      console.error('❌ LIVE SITE: Error message:', error.message);
      console.error('❌ LIVE SITE: Error stack:', error.stack);
      
      // Check for specific error types
      if (error.code === 'permission-denied') {
        console.error('❌ LIVE SITE: Firestore permission denied - check security rules');
      } else if (error.code === 'unavailable') {
        console.error('❌ LIVE SITE: Firestore service unavailable');
      } else if (error.code === 'unauthenticated') {
        console.error('❌ LIVE SITE: User not authenticated');
      }
      
      return { success: false, error: error.message };
    }
  },

  // Get tasks for a specific user (assigned to them)
  getUserTasks: async (userEmail, farmCode) => {
    try {
      console.log('📝 TASK SERVICE: Getting tasks for user:', userEmail);
      console.log('📝 TASK SERVICE: Farm code:', farmCode);
      
      const tasksRef = collection(db, COLLECTIONS.TASKS);
      const q = query(
        tasksRef,
        where('farmCode', '==', farmCode),
        where('assignedTo', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
      
      console.log('📝 TASK SERVICE: Query created for user tasks');
      
      const querySnapshot = await getDocs(q);
      const tasks = [];
      
      querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        tasks.push({
          ...taskData,
          id: doc.id,
          createdAt: taskData.createdAt?.toDate?.() || taskData.createdAt,
          updatedAt: taskData.updatedAt?.toDate?.() || taskData.updatedAt,
          completedAt: taskData.completedAt?.toDate?.() || taskData.completedAt,
          lastNotified: taskData.lastNotified?.toDate?.() || taskData.lastNotified
        });
      });
      
      console.log('📝 TASK SERVICE: Found tasks for user:', tasks.length);
      console.log('📝 TASK SERVICE: Tasks data:', tasks);
      
      return { success: true, tasks };
    } catch (error) {
      console.error('❌ TASK SERVICE: Error getting user tasks:', error);
      return { success: false, error: error.message, tasks: [] };
    }
  },

  // Load user tasks with real-time updates
  loadUserTasks: (userEmail, farmCode, callback) => {
    try {
      console.log('📝 TASK SERVICE: Setting up real-time listener for user:', userEmail);
      console.log('📝 TASK SERVICE: Farm code:', farmCode);
      
      const q = query(
        collection(db, COLLECTIONS.TASKS),
        where('farmCode', '==', farmCode),
        where('assignedTo', '==', userEmail),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
          completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt,
          lastNotified: doc.data().lastNotified?.toDate?.() || doc.data().lastNotified
        }));
        
        console.log('📋 TASK SERVICE: Loaded tasks for user:', userEmail, tasks);
        callback(tasks);
      }, (error) => {
        console.error('❌ TASK SERVICE: Real-time listener error:', error);
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ TASK SERVICE: Error setting up real-time listener:', error);
      return () => {};
    }
  },

  // Get all tasks for a farm (for owner/admin view)
  getFarmTasks: async (farmCode) => {
    try {
      console.log('📝 TASK SERVICE: Getting all tasks for farm:', farmCode);
      
      const tasksRef = collection(db, COLLECTIONS.TASKS);
      const q = query(
        tasksRef,
        where('farmCode', '==', farmCode),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks = [];
      
      querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        tasks.push({
          ...taskData,
          id: doc.id,
          createdAt: taskData.createdAt?.toDate?.() || taskData.createdAt,
          updatedAt: taskData.updatedAt?.toDate?.() || taskData.updatedAt,
          completedAt: taskData.completedAt?.toDate?.() || taskData.completedAt,
          lastNotified: taskData.lastNotified?.toDate?.() || taskData.lastNotified
        });
      });
      
      console.log('📝 TASK SERVICE: Found tasks for farm:', tasks.length);
      console.log('📝 TASK SERVICE: All farm tasks:', tasks);
      
      return { success: true, tasks };
    } catch (error) {
      console.error('❌ TASK SERVICE: Error getting farm tasks:', error);
      return { success: false, error: error.message, tasks: [] };
    }
  },

  // Update a task
  updateTask: async (taskId, updates) => {
    try {
      console.log('📝 TASK SERVICE: Updating task:', taskId);
      console.log('📝 TASK SERVICE: Updates:', updates);
      
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(taskRef, updateData);
      
      console.log('✅ TASK SERVICE: Task updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ TASK SERVICE: Error updating task:', error);
      return { success: false, error: error.message };
    }
  },

  // Complete a task
  completeTask: async (taskId) => {
    try {
      console.log('📝 TASK SERVICE: Completing task:', taskId);
      
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      
      await updateDoc(taskRef, {
        status: 'completed',
        completed: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ TASK SERVICE: Task completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ TASK SERVICE: Error completing task:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a task
  deleteTask: async (taskId) => {
    try {
      console.log('📝 TASK SERVICE: Deleting task:', taskId);
      
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      await deleteDoc(taskRef);
      
      console.log('✅ TASK SERVICE: Task deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ TASK SERVICE: Error deleting task:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listener for tasks
  subscribeToUserTasks: (userEmail, farmCode, callback) => {
    try {
      console.log('📝 TASK SERVICE: Setting up real-time listener for user:', userEmail);
      console.log('📝 TASK SERVICE: Farm code:', farmCode);
      
      const tasksRef = collection(db, COLLECTIONS.TASKS);
      const q = query(
        tasksRef,
        where('farmCode', '==', farmCode),
        where('assignedTo', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasks = [];
        querySnapshot.forEach((doc) => {
          const taskData = doc.data();
          tasks.push({
            ...taskData,
            id: doc.id,
            createdAt: taskData.createdAt?.toDate?.() || taskData.createdAt,
            updatedAt: taskData.updatedAt?.toDate?.() || taskData.updatedAt,
            completedAt: taskData.completedAt?.toDate?.() || taskData.completedAt,
            lastNotified: taskData.lastNotified?.toDate?.() || taskData.lastNotified
          });
        });
        
        console.log('📝 TASK SERVICE: Real-time update - tasks for user:', tasks.length);
        console.log('📝 TASK SERVICE: Real-time tasks data:', tasks);
        
        callback(tasks);
      }, (error) => {
        console.error('❌ TASK SERVICE: Real-time listener error:', error);
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ TASK SERVICE: Error setting up real-time listener:', error);
      return () => {};
    }
  },

  // Debug function to get all tasks (for debugging)
  getAllTasks: async () => {
    try {
      console.log('📝 TASK SERVICE: Getting ALL tasks for debugging');
      
      const tasksRef = collection(db, COLLECTIONS.TASKS);
      const querySnapshot = await getDocs(tasksRef);
      const tasks = [];
      
      querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        tasks.push({
          ...taskData,
          id: doc.id,
          createdAt: taskData.createdAt?.toDate?.() || taskData.createdAt,
          updatedAt: taskData.updatedAt?.toDate?.() || taskData.updatedAt,
          completedAt: taskData.completedAt?.toDate?.() || taskData.completedAt,
          lastNotified: taskData.lastNotified?.toDate?.() || taskData.lastNotified
        });
      });
      
      console.log('📝 TASK SERVICE: ALL tasks in database:', tasks);
      return { success: true, tasks };
    } catch (error) {
      console.error('❌ TASK SERVICE: Error getting all tasks:', error);
      return { success: false, error: error.message, tasks: [] };
    }
  }
};

export default taskService; 