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
              
              // FORCE STATE UPDATE:
              setFarmDataState(prevState => {
                console.log('🔥 FORCING: Previous farmData state:', prevState);
                console.log('🔥 FORCING: New farmData state:', dataResult.data);
                return { ...dataResult.data };
              });
            }
            
            // Load farm info
            const farmResult = await getFarmByCode(userData.farmCode);
            console.log('🔐 STEP 9: Farm info result:', farmResult);
            
            if (farmResult.success) {
              console.log('🔐 STEP 10: Setting farm state:', farmResult.farm);
              console.log('🚨 FARM STATE DEBUG: About to set farm state');
              console.log('🚨 FARM STATE DEBUG: Farm data to set:', farmResult.farm);
              setFarm(farmResult.farm);
              console.log('🚨 FARM STATE DEBUG: Farm state set successfully');
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

  // EMERGENCY FIX: DISABLED automatic farm data saving to stop infinite loop
  // Save farm data when it changes
  // useEffect(() => {
  //   if (user?.farmCode && farmData) {
  //     setFarmData(user.farmCode, farmData);
  //   }
  // }, [farmData, user?.farmCode]);
  
  // 🚨 FARM STATE MONITORING: Track farm state changes
  useEffect(() => {
    console.log('🚨 FARM STATE MONITOR: Farm state changed to:', farm);
    console.log('🚨 FARM STATE MONITOR: Farm state type:', typeof farm);
    console.log('🚨 FARM STATE MONITOR: Farm state keys:', farm ? Object.keys(farm) : 'null');
  }, [farm]);

  // 🔄 FARM SYNC: Real-time sync debugging
  useEffect(() => {
    if (farm?.farmCode) {
      console.log('🔄 FARM SYNC: Loading farm data for code:', farm.farmCode);
      console.log('🔄 FARM SYNC: Current cow count:', farmData?.cows?.length || 0);
      console.log('🔄 FARM SYNC: Timestamp:', new Date().toISOString());
    }
  }, [farm, farmData]);

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

  const updateCows = async (newCows) => {
    console.log('🚨 EMERGENCY STOP: updateCows called - checking for infinite loop');
    console.log('💾 FIREBASE SAVE: updateCows called with', newCows.length, 'cows');
    console.log('🔥 EMERGENCY: Connection status:', navigator.onLine);
    console.log('🔥 EMERGENCY: User authenticated:', !!user);
    console.log('🔥 EMERGENCY: Farm code:', user?.farmCode);
    
    // Update local state
    setFarmDataState(prevData => {
      const updatedData = {
        ...prevData,
        cows: newCows
      };
      
      // Save to Firebase with error handling
      if (user?.farmCode) {
        console.log('💾 FIREBASE SAVE: Attempting to save complete farm data to Firebase');
        
        // Use async IIFE to handle the async operation
        (async () => {
          try {
            console.log('🔥 EMERGENCY: Starting Firestore save operation');
            const result = await setFarmData(user.farmCode, updatedData);
            console.log('🔥 EMERGENCY: Firestore save result:', result);
            
            if (result && result.success) {
              console.log('✅ FIREBASE SAVE: Data saved successfully to Firestore');
            } else {
              console.error('❌ FIRESTORE ERROR: Save operation failed:', result?.error);
              // Don't reload data if save failed - keep local changes
              console.log('🚫 Skipping data reload due to save failure');
            }
          } catch (error) {
            console.error('❌ FIRESTORE ERROR: Exception during save:', error);
            console.error('❌ FIRESTORE ERROR: Error details:', {
              code: error.code,
              message: error.message,
              stack: error.stack
            });
            // Don't reload data if save failed - keep local changes
            console.log('🚫 Skipping data reload due to save exception');
          }
        })();
      }
      
      return updatedData;
    });
  };

  const updateBullInventory = async (newBullInventory) => {
    console.log('🚨 EMERGENCY STOP: updateBullInventory called - checking for infinite loop');
    console.log('💾 FIREBASE SAVE: updateBullInventory called with', newBullInventory.length, 'bulls');
    console.log('🔥 EMERGENCY: Connection status:', navigator.onLine);
    console.log('🔥 EMERGENCY: User authenticated:', !!user);
    console.log('🔥 EMERGENCY: Farm code:', user?.farmCode);
    
    // Update local state
    setFarmDataState(prevData => {
      const updatedData = {
        ...prevData,
        bullInventory: newBullInventory
      };
      
      // Save to Firebase with error handling
      if (user?.farmCode) {
        console.log('💾 FIREBASE SAVE: Attempting to save complete farm data to Firebase');
        
        // Use async IIFE to handle the async operation
        (async () => {
          try {
            console.log('🔥 EMERGENCY: Starting Firestore save operation');
            const result = await setFarmData(user.farmCode, updatedData);
            console.log('🔥 EMERGENCY: Firestore save result:', result);
            
            if (result && result.success) {
              console.log('✅ FIREBASE SAVE: Bull inventory saved successfully to Firestore');
            } else {
              console.error('❌ FIRESTORE ERROR: Bull inventory save failed:', result?.error);
              // Don't reload data if save failed - keep local changes
              console.log('🚫 Skipping data reload due to save failure');
            }
          } catch (error) {
            console.error('❌ FIRESTORE ERROR: Exception during bull inventory save:', error);
            console.error('❌ FIRESTORE ERROR: Error details:', {
              code: error.code,
              message: error.message,
              stack: error.stack
            });
            // Don't reload data if save failed - keep local changes
            console.log('🚫 Skipping data reload due to save exception');
          }
        })();
      }
      
      return updatedData;
    });
  };

  // Test Firebase connection
  const testFirebaseConnection = async () => {
    console.log('🔥 EMERGENCY: Testing Firebase connection...');
    try {
      // Try to read a test document
      const testDoc = await getDoc(doc(db, 'test', 'connection'));
      console.log('✅ Firebase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ FIRESTORE ERROR: Connection test failed:', error);
      console.error('❌ FIRESTORE ERROR: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  };

  const updateProfileData = async (newProfileData) => {
    console.log('🚨 EMERGENCY STOP: updateProfileData called - checking for infinite loop');
    console.log('💾 FIREBASE SAVE: updateProfileData called');
    console.log('🔥 EMERGENCY: Connection status:', navigator.onLine);
    console.log('🔥 EMERGENCY: User authenticated:', !!user);
    console.log('🔥 EMERGENCY: Farm code:', user?.farmCode);
    
    // Update local state
    setFarmDataState(prevData => {
      const updatedData = {
        ...prevData,
        profileData: {
          ...prevData.profileData,
          ...newProfileData
        }
      };
      
      // Save to Firebase with error handling
      if (user?.farmCode) {
        console.log('💾 FIREBASE SAVE: Attempting to save complete farm data to Firebase');
        
        // Use async IIFE to handle the async operation
        (async () => {
          try {
            console.log('🔥 EMERGENCY: Starting Firestore save operation');
            const result = await setFarmData(user.farmCode, updatedData);
            console.log('🔥 EMERGENCY: Firestore save result:', result);
            
            if (result && result.success) {
              console.log('✅ FIREBASE SAVE: Profile data saved successfully to Firestore');
            } else {
              console.error('❌ FIRESTORE ERROR: Profile data save failed:', result?.error);
              // Don't reload data if save failed - keep local changes
              console.log('🚫 Skipping data reload due to save failure');
            }
          } catch (error) {
            console.error('❌ FIRESTORE ERROR: Exception during profile data save:', error);
            console.error('❌ FIRESTORE ERROR: Error details:', {
              code: error.code,
              message: error.message,
              stack: error.stack
            });
            // Don't reload data if save failed - keep local changes
            console.log('🚫 Skipping data reload due to save exception');
          }
        })();
      }
      
      return updatedData;
    });
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
    testFirebaseConnection,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 