/**
 * Authentication Utilities
 * Functions for managing user authentication and farm access
 */

import { generateFarmCode, validateFarmCode } from './farmCodeUtils';

// LocalStorage keys
const AUTH_KEY = 'cattleAppAuth';
const FARMS_KEY = 'cattleAppFarms';
const USERS_KEY = 'cattleAppUsers';

/**
 * User authentication state
 */
export const getAuthState = () => {
  try {
    const authData = localStorage.getItem(AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Error getting auth state:', error);
    return null;
  }
};

export const setAuthState = (authData) => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    return true;
  } catch (error) {
    console.error('Error setting auth state:', error);
    return false;
  }
};

export const clearAuthState = () => {
  try {
    localStorage.removeItem(AUTH_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing auth state:', error);
    return false;
  }
};

/**
 * Farm management
 */
export const getFarms = () => {
  try {
    const farmsData = localStorage.getItem(FARMS_KEY);
    return farmsData ? JSON.parse(farmsData) : {};
  } catch (error) {
    console.error('Error getting farms:', error);
    return {};
  }
};

export const setFarms = (farms) => {
  try {
    localStorage.setItem(FARMS_KEY, JSON.stringify(farms));
    return true;
  } catch (error) {
    console.error('Error setting farms:', error);
    return false;
  }
};

export const createFarm = (farmData) => {
  try {
    const farms = getFarms();
    const farmCode = generateFarmCode();
    
    // Ensure farm code is unique
    while (farms[farmCode]) {
      farmCode = generateFarmCode();
    }
    
    const newFarm = {
      id: farmCode,
      code: farmCode,
      name: farmData.farmName,
      ownerName: farmData.ownerName,
      ownerEmail: farmData.email,
      createdAt: new Date().toISOString(),
      members: [farmData.email], // Owner is first member
      settings: {
        operationType: farmData.operationType || 'Dairy',
        herdSize: farmData.herdSize || '100-500',
        yearsInOperation: farmData.yearsInOperation || '1'
      }
    };
    
    farms[farmCode] = newFarm;
    setFarms(farms);
    
    return { success: true, farm: newFarm };
  } catch (error) {
    console.error('Error creating farm:', error);
    return { success: false, error: 'Failed to create farm' };
  }
};

export const getFarmByCode = (farmCode) => {
  try {
    const farms = getFarms();
    return farms[farmCode] || null;
  } catch (error) {
    console.error('Error getting farm by code:', error);
    return null;
  }
};

export const addMemberToFarm = (farmCode, userEmail) => {
  try {
    const farms = getFarms();
    const farm = farms[farmCode];
    
    if (!farm) {
      return { success: false, error: 'Farm not found' };
    }
    
    if (!farm.members.includes(userEmail)) {
      farm.members.push(userEmail);
      setFarms(farms);
    }
    
    return { success: true, farm };
  } catch (error) {
    console.error('Error adding member to farm:', error);
    return { success: false, error: 'Failed to add member' };
  }
};

/**
 * User management
 */
export const getUsers = () => {
  try {
    const usersData = localStorage.getItem(USERS_KEY);
    return usersData ? JSON.parse(usersData) : {};
  } catch (error) {
    console.error('Error getting users:', error);
    return {};
  }
};

export const setUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error setting users:', error);
    return false;
  }
};

export const createUser = (userData) => {
  try {
    const users = getUsers();
    
    if (users[userData.email]) {
      return { success: false, error: 'User already exists' };
    }
    
    const newUser = {
      email: userData.email,
      password: userData.password, // In production, this should be hashed
      name: userData.name || userData.ownerName,
      farmCode: userData.farmCode,
      role: userData.farmCode ? 'member' : 'owner',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    users[userData.email] = newUser;
    setUsers(users);
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
};

export const authenticateUser = (email, password) => {
  try {
    const users = getUsers();
    const user = users[email];
    
    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    setUsers(users);
    
    // Get farm data
    const farm = user.farmCode ? getFarmByCode(user.farmCode) : null;
    
    return { 
      success: true, 
      user: { ...user, password: undefined }, // Don't return password
      farm 
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

export const getUserByEmail = (email) => {
  try {
    const users = getUsers();
    const user = users[email];
    return user ? { ...user, password: undefined } : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

/**
 * Validation functions
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
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
export const getFarmData = (farmCode) => {
  try {
    const farmData = localStorage.getItem(`cattleAppFarm_${farmCode}`);
    return farmData ? JSON.parse(farmData) : {
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
        yearsInOperation: '1',
        farmLogo: null
      }
    };
  } catch (error) {
    console.error('Error getting farm data:', error);
    return {
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
        yearsInOperation: '1',
        farmLogo: null
      }
    };
  }
};

export const setFarmData = (farmCode, data) => {
  try {
    localStorage.setItem(`cattleAppFarm_${farmCode}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error setting farm data:', error);
    return false;
  }
};

/**
 * Logout function
 */
export const logout = () => {
  clearAuthState();
  // Clear any farm-specific data from localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('cattleAppFarm_')) {
      localStorage.removeItem(key);
    }
  });
}; 