import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  getFarmData,
  setFarmData,
  getFarmByCode,
  logout as logoutUser
} from '../utils/authUtils';
import { firebaseAuth } from '../utils/firestoreService';

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

  // Load authentication state on app start using Firebase Auth
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in - get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          const fullUser = {
            ...firebaseUser,
            ...userData,
            displayName: userData?.name || firebaseUser.displayName
          };
          
          setUser(fullUser);
          
          // Load farm-specific data if user has farmCode
          if (userData?.farmCode) {
            console.log('🔐 STEP 4: User authenticated:', fullUser);
            console.log('🔐 STEP 5: Loading farm data for farmCode:', userData.farmCode);
            
            const dataResult = await getFarmData(userData.farmCode);
            console.log('🔐 STEP 6: Farm data result:', dataResult);
            
            if (dataResult.success) {
              console.log('🔐 STEP 7: Setting farm data state:', dataResult.data);
              console.log('🔐 STEP 8: Farm profile data:', dataResult.data?.profileData);
              setFarmDataState(dataResult.data);
            }
            
            // Load farm info
            const farmResult = await getFarmByCode(userData.farmCode);
            console.log('🔐 STEP 9: Farm info result:', farmResult);
            
            if (farmResult.success) {
              console.log('🔐 STEP 10: Setting farm state:', farmResult.farm);
              setFarm(farmResult.farm);
            }
          } else {
            console.log('🔐 STEP 4: User authenticated but no farmCode:', fullUser);
          }
        } else {
          // User is signed out
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
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Save farm data when it changes
  useEffect(() => {
    if (user?.farmCode && farmData) {
      setFarmData(user.farmCode, farmData);
    }
  }, [farmData, user?.farmCode]);

  const login = async (authData) => {
    setUser(authData.user);
    setFarm(authData.farm);
    
    // Load farm-specific data
    if (authData.user?.farmCode) {
      const dataResult = await getFarmData(authData.user.farmCode);
      if (dataResult.success) {
        setFarmDataState(dataResult.data);
      }
    }
  };

  const logout = async () => {
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
    await logoutUser();
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