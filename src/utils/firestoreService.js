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
  runTransaction
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../firebase/config';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  FARMS: 'farms',
  FARM_DATA: 'farmData'
};

// Authentication functions
export const firebaseAuth = {
  // Create new user account
  createUser: async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with display name
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name
        });
      }
      
      // Store additional user data in Firestore
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        ...userData,
        email: user.email,
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        user: { 
          ...user, 
          ...userData,
          displayName: userData.name || user.displayName
        } 
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in existing user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
      const userData = userDoc.data();
      
      return { 
        success: true, 
        user: { 
          ...user, 
          ...userData,
          displayName: userData?.name || user.displayName
        } 
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};

// Farm management functions
export const farmService = {
  // Create new farm
  createFarm: async (farmData) => {
    try {
      const farmRef = doc(db, COLLECTIONS.FARMS, farmData.farmCode);
      
      // Check if farm code already exists
      const existingFarm = await getDoc(farmRef);
      if (existingFarm.exists()) {
        return { success: false, error: 'Farm code already exists' };
      }
      
      await setDoc(farmRef, {
        ...farmData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, farm: farmData };
    } catch (error) {
      console.error('Error creating farm:', error);
      return { success: false, error: error.message };
    }
  },

  // Get farm by code
  getFarmByCode: async (farmCode) => {
    try {
      const farmDoc = await getDoc(doc(db, COLLECTIONS.FARMS, farmCode));
      if (farmDoc.exists()) {
        return { success: true, farm: farmDoc.data() };
      } else {
        return { success: false, error: 'Farm not found' };
      }
    } catch (error) {
      console.error('Error getting farm:', error);
      return { success: false, error: error.message };
    }
  },

  // Add member to farm
  addMemberToFarm: async (farmCode, userEmail) => {
    try {
      const farmRef = doc(db, COLLECTIONS.FARMS, farmCode);
      const farmDoc = await getDoc(farmRef);
      
      if (!farmDoc.exists()) {
        return { success: false, error: 'Farm not found' };
      }
      
      const farmData = farmDoc.data();
      const members = farmData.members || [];
      
      if (!members.includes(userEmail)) {
        members.push(userEmail);
        await updateDoc(farmRef, {
          members,
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding member to farm:', error);
      return { success: false, error: error.message };
    }
  },

  // Update farm settings
  updateFarmSettings: async (farmCode, settings) => {
    try {
      const farmRef = doc(db, COLLECTIONS.FARMS, farmCode);
      await updateDoc(farmRef, {
        settings,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating farm settings:', error);
      return { success: false, error: error.message };
    }
  }
};

// Farm data management functions
export const farmDataService = {
  // Get farm data
  getFarmData: async (farmCode) => {
    try {
      console.log('🗄️ DEBUG: Firestore - Getting farm data for farmCode:', farmCode);
      const farmDataDoc = await getDoc(doc(db, COLLECTIONS.FARM_DATA, farmCode));
      console.log('🗄️ DEBUG: Firestore - Document exists:', farmDataDoc.exists());
      
      if (farmDataDoc.exists()) {
        const data = farmDataDoc.data();
        console.log('🗄️ DEBUG: Firestore - Retrieved data:', data);
        console.log('🗄️ DEBUG: Firestore - Profile data in document:', data.profileData);
        return { success: true, data: data };
      } else {
        console.log('🗄️ DEBUG: Firestore - Document does not exist, returning default data');
        // Return default empty data structure
        return { 
          success: true, 
          data: {
            cows: [],
            bullInventory: [],
            profileData: {
              farmName: '',
              ownerName: '',
              farmAddress: '',
              phone: '',
              email: '',
              operationType: 'Dairy',
              herdSize: '100-500',
              yearsInOperation: '15',
              farmLogo: null
            }
          }
        };
      }
    } catch (error) {
      console.error('❌ Error getting farm data:', error);
      return { success: false, error: error.message };
    }
  },

  // Update farm data
  updateFarmData: async (farmCode, data) => {
    try {
      console.log('🗄️ DEBUG: Firestore - Updating farm data for farmCode:', farmCode);
      console.log('🗄️ DEBUG: Firestore - Data being saved:', data);
      console.log('🗄️ DEBUG: Firestore - Profile data being saved:', data.profileData);
      
      await setDoc(doc(db, COLLECTIONS.FARM_DATA, farmCode), {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      console.log('🗄️ DEBUG: Firestore - Farm data saved successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating farm data:', error);
      return { success: false, error: error.message };
    }
  },

  // Update specific farm data section
  updateFarmDataSection: async (farmCode, section, data) => {
    try {
      const farmDataRef = doc(db, COLLECTIONS.FARM_DATA, farmCode);
      await updateDoc(farmDataRef, {
        [section]: data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating farm data section:', error);
      return { success: false, error: error.message };
    }
  },

  // Add cow to farm
  addCowToFarm: async (farmCode, cowData) => {
    try {
      const farmDataRef = doc(db, COLLECTIONS.FARM_DATA, farmCode);
      const farmDataDoc = await getDoc(farmDataRef);
      
      let currentData = { cows: [] };
      if (farmDataDoc.exists()) {
        currentData = farmDataDoc.data();
      }
      
      const updatedCows = [...(currentData.cows || []), cowData];
      
      await setDoc(farmDataRef, {
        ...currentData,
        cows: updatedCows,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding cow to farm:', error);
      return { success: false, error: error.message };
    }
  },

  // Update cow in farm
  updateCowInFarm: async (farmCode, cowId, updatedCowData) => {
    try {
      const farmDataRef = doc(db, COLLECTIONS.FARM_DATA, farmCode);
      const farmDataDoc = await getDoc(farmDataRef);
      
      if (!farmDataDoc.exists()) {
        return { success: false, error: 'Farm data not found' };
      }
      
      const currentData = farmDataDoc.data();
      const updatedCows = currentData.cows.map(cow => 
        cow.id === cowId ? { ...cow, ...updatedCowData } : cow
      );
      
      await updateDoc(farmDataRef, {
        cows: updatedCows,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating cow in farm:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete cow from farm
  deleteCowFromFarm: async (farmCode, cowId) => {
    try {
      const farmDataRef = doc(db, COLLECTIONS.FARM_DATA, farmCode);
      const farmDataDoc = await getDoc(farmDataRef);
      
      if (!farmDataDoc.exists()) {
        return { success: false, error: 'Farm data not found' };
      }
      
      const currentData = farmDataDoc.data();
      const updatedCows = currentData.cows.filter(cow => cow.id !== cowId);
      
      await updateDoc(farmDataRef, {
        cows: updatedCows,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting cow from farm:', error);
      return { success: false, error: error.message };
    }
  }
};

// User management functions
export const userService = {
  // Get user by email
  getUserByEmail: async (email) => {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user data
  updateUser: async (userId, userData) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        ...userData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }
};

// Utility functions
export const utils = {
  // Generate unique farm code
  generateFarmCode: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Validate farm code format
  validateFarmCode: (code) => {
    return /^[A-Z0-9]{6}$/.test(code);
  },

  // Validate email format
  validateEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Validate password strength
  validatePassword: (password) => {
    return password.length >= 6;
  },

  // Generate unique ID
  generateId: (prefix = 'item') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  },

  // Convert Firestore timestamp to Date
  timestampToDate: (timestamp) => {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  },

  // Convert Date to Firestore timestamp
  dateToTimestamp: (date) => {
    if (!date) return null;
    return serverTimestamp();
  }
};

// Batch operations for better performance
export const batchService = {
  // Batch update multiple documents
  batchUpdate: async (updates) => {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ collection, docId, data }) => {
        const docRef = doc(db, collection, docId);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error in batch update:', error);
      return { success: false, error: error.message };
    }
  },

  // Batch set multiple documents
  batchSet: async (sets) => {
    try {
      const batch = writeBatch(db);
      
      sets.forEach(({ collection, docId, data }) => {
        const docRef = doc(db, collection, docId);
        batch.set(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error in batch set:', error);
      return { success: false, error: error.message };
    }
  }
}; 