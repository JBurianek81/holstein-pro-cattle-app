import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuthState, 
  setAuthState, 
  clearAuthState,
  getFarmData,
  setFarmData,
  logout as logoutUser
} from '../utils/authUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [farm, setFarm] = useState(null);
  const [farmData, setFarmDataState] = useState({
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
  });
  const [loading, setLoading] = useState(true);

  // Load authentication state on app start
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const authState = getAuthState();
        if (authState) {
          setUser(authState.user);
          setFarm(authState.farm);
          
          // Load farm-specific data
          if (authState.user?.farmCode) {
            const data = getFarmData(authState.user.farmCode);
            setFarmDataState(data);
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Save farm data when it changes
  useEffect(() => {
    if (user?.farmCode && farmData) {
      setFarmData(user.farmCode, farmData);
    }
  }, [farmData, user?.farmCode]);

  const login = (authData) => {
    setUser(authData.user);
    setFarm(authData.farm);
    
    // Load farm-specific data
    if (authData.user?.farmCode) {
      const data = getFarmData(authData.user.farmCode);
      setFarmDataState(data);
    }
    
    // Save auth state
    setAuthState(authData);
  };

  const logout = () => {
    setUser(null);
    setFarm(null);
    setFarmDataState({
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
    });
    logoutUser();
  };

  const updateFarmData = (newData) => {
    setFarmDataState(prevData => ({
      ...prevData,
      ...newData
    }));
  };

  const updateCows = (newCows) => {
    setFarmDataState(prevData => ({
      ...prevData,
      cows: newCows
    }));
  };

  const updateBullInventory = (newBullInventory) => {
    setFarmDataState(prevData => ({
      ...prevData,
      bullInventory: newBullInventory
    }));
  };

  const updateProfileData = (newProfileData) => {
    setFarmDataState(prevData => ({
      ...prevData,
      profileData: {
        ...prevData.profileData,
        ...newProfileData
      }
    }));
  };

  const value = {
    user,
    farm,
    farmData,
    loading,
    login,
    logout,
    updateFarmData,
    updateCows,
    updateBullInventory,
    updateProfileData,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 