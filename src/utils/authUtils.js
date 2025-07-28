/**
 * Authentication Utilities
 * Functions for managing user authentication and farm access using Firebase
 */

import { firebaseAuth, farmService, farmDataService, userService, utils } from './firestoreService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Re-export farm code utilities for backward compatibility
export const generateFarmCode = utils.generateFarmCode;
export const validateFarmCode = utils.validateFarmCode;

/**
 * User authentication state
 */
export const getAuthState = () => {
  // This will be handled by Firebase Auth state listener
  return null;
};

export const setAuthState = (authData) => {
  // This will be handled by Firebase Auth
  return true;
};

export const clearAuthState = () => {
  // This will be handled by Firebase Auth signOut
  return true;
};

/**
 * Farm management
 */
export const getFarms = async () => {
  // This would require a different approach with Firestore
  // For now, return empty object as this function isn't used in the current flow
  return {};
};

export const setFarms = (farms) => {
  // This would require a different approach with Firestore
  return true;
};

export const createFarm = async (farmData) => {
  try {
    console.log('🏠 STEP 1: Creating farm with data:', farmData);
    
    const farmCode = generateFarmCode();
    
    const newFarm = {
      farmCode,
      name: farmData.farmName,
      ownerName: farmData.ownerName,
      ownerEmail: farmData.email,
      members: [farmData.email], // Owner is first member
      settings: {
        operationType: farmData.operationType || 'Dairy',
        herdSize: farmData.herdSize || '100-500',
        yearsInOperation: farmData.yearsInOperation || '1'
      }
    };
    
    console.log('🏠 STEP 2: Farm object being saved:', newFarm);
    
    // Create the farm
    const result = await farmService.createFarm(newFarm);
    console.log('🏠 STEP 3: Farm creation result:', result);
    
    if (result.success) {
      // Create initial farm data with profile information
      const initialFarmData = {
        cows: [],
        bullInventory: [],
        profileData: {
          farmName: farmData.farmName,
          ownerName: farmData.ownerName,
          farmAddress: '',
          phone: '',
          email: farmData.email,
          operationType: farmData.operationType || 'Dairy',
          herdSize: farmData.herdSize || '100-500',
          yearsInOperation: farmData.yearsInOperation || '1',
          farmLogo: null
        }
      };
      
      console.log('🏠 STEP 3.5: Saving farm data with profile data:', initialFarmData);
      
      // Save initial farm data
      const saveResult = await setFarmData(farmCode, initialFarmData);
      console.log('🏠 STEP 4: Farm data save result:', saveResult);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error creating farm:', error);
    return { success: false, error: 'Failed to create farm' };
  }
};

export const getFarmByCode = async (farmCode) => {
  try {
    const result = await farmService.getFarmByCode(farmCode);
    return result;
  } catch (error) {
    console.error('Error getting farm:', error);
    return { success: false, error: 'Failed to get farm' };
  }
};

export const addMemberToFarm = async (farmCode, userEmail) => {
  try {
    const result = await farmService.addMemberToFarm(farmCode, userEmail);
    return result;
  } catch (error) {
    console.error('Error adding member to farm:', error);
    return { success: false, error: 'Failed to add member to farm' };
  }
};

export const joinFarmByCode = async (farmCode, user) => {
  try {
    console.log('🏭 JOIN: User joining farm with code:', farmCode);
    console.log('🏭 JOIN: User data:', user);
    
    const farmRef = doc(db, 'farms', farmCode);
    const farmSnap = await getDoc(farmRef);
    
    if (farmSnap.exists()) {
      const farmData = farmSnap.data();
      const newMember = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        joinedDate: new Date().toISOString(),
        role: 'member'
      };
      
      // Add to members array if not already there
      const existingMembers = farmData.members || [];
      const isAlreadyMember = existingMembers.some(member => member.email === user.email);
      
      if (!isAlreadyMember) {
        const updatedMembers = [...existingMembers, newMember];
        await updateDoc(farmRef, { members: updatedMembers });
        console.log('👥 JOIN: Added new member to farm:', newMember);
      } else {
        console.log('👥 JOIN: User is already a member of this farm');
      }
      
      return { success: true, farm: farmData };
    } else {
      return { success: false, error: 'Farm not found' };
    }
  } catch (error) {
    console.error('❌ Error joining farm:', error);
    return { success: false, error: 'Failed to join farm' };
  }
};

/**
 * User management
 */
export const getUsers = () => {
  // This would require a different approach with Firestore
  // For now, return empty object as this function isn't used in the current flow
  return {};
};

export const setUsers = (users) => {
  // This would require a different approach with Firestore
  return true;
};

export const createUser = async (userData) => {
  try {
    const { email, password, ...otherData } = userData;
    
    const result = await firebaseAuth.createUser(email, password, {
      ...otherData,
      role: userData.role || 'member',
      farmCode: userData.farmCode || null
    });
    
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
};

export const updateUserFarmCode = async (userId, farmCode) => {
  try {
    const result = await userService.updateUser(userId, { farmCode });
    return result;
  } catch (error) {
    console.error('Error updating user farm code:', error);
    return { success: false, error: 'Failed to update user farm code' };
  }
};

export const authenticateUser = async (email, password) => {
  try {
    const result = await firebaseAuth.signIn(email, password);
    
    if (result.success) {
      // Get user's farm data
      const userData = result.user;
      if (userData.farmCode) {
        const farmResult = await getFarmByCode(userData.farmCode);
        if (farmResult.success) {
          return {
            success: true,
            user: userData,
            farm: farmResult.farm
          };
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return { success: false, error: 'Failed to authenticate user' };
  }
};

export const getUserByEmail = async (email) => {
  try {
    const result = await userService.getUserByEmail(email);
    return result;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return { success: false, error: 'Failed to get user' };
  }
};

/**
 * Validation functions
 */
export const validateEmail = (email) => {
  return utils.validateEmail(email);
};

export const validatePassword = (password) => {
  return utils.validatePassword(password);
};

export const validateFarmName = (farmName) => {
  return farmName && farmName.trim().length >= 2;
};

export const validateOwnerName = (ownerName) => {
  return ownerName && ownerName.trim().length >= 2;
};

/**
 * Farm data management
 */
export const getFarmData = async (farmCode) => {
  try {
    console.log('🔍 DEBUG: Getting farm data for farmCode:', farmCode);
    const result = await farmDataService.getFarmData(farmCode);
    console.log('🔍 DEBUG: Farm data service result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error getting farm data:', error);
    return { success: false, error: 'Failed to get farm data' };
  }
};

export const setFarmData = async (farmCode, data) => {
  try {
    const result = await farmDataService.updateFarmData(farmCode, data);
    return result;
  } catch (error) {
    console.error('Error setting farm data:', error);
    return { success: false, error: 'Failed to set farm data' };
  }
};

/**
 * Logout function
 */
export const logout = async () => {
  try {
    const result = await firebaseAuth.signOut();
    return result;
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error: 'Failed to logout' };
  }
}; 