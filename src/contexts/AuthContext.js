import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  getFarmData,
  setFarmData,
  getFarmByCode,
  logout as logoutUser
} from '../utils/authUtils';
import { firebaseAuth } from '../utils/firestoreService';
import { useCattleRealtime } from '../hooks/useCattleRealtime';

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
  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [farmUnsubscribe, setFarmUnsubscribe] = useState(null);
  
  // Use real-time cattle data as the primary source
  const { cows: realtimeCows, loading: cattleLoading } = useCattleRealtime(
    user?.farmCode, 
    user
  );

  // Update the cows state to use real-time data
  const [cows, setCows] = useState([]);
  
  // Sync real-time cattle data to local state
  useEffect(() => {
    if (realtimeCows && realtimeCows.length > 0) {
      console.log('🔄 AUTH SYNC: Updating cows from real-time data:', realtimeCows.length);
      setCows(realtimeCows);
    } else if (realtimeCows && realtimeCows.length === 0) {
      console.log('🔄 AUTH SYNC: No cattle found in real-time data');
      setCows([]);
    }
  }, [realtimeCows]);

  const [bullInventory, setBullInventory] = useState([]);
  const [profileData, setProfileData] = useState({
    farmName: '',
    ownerName: '',
    farmAddress: '',
    phone: '',
    email: '',
    operationType: 'Dairy',
    herdSize: '100-500',
    yearsInOperation: '1',
    farmLogo: null
  });

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
            
            // Set up real-time listener for farmData document
            console.log('🔥 REAL-TIME: Setting up farmData document listener for:', userData.farmCode);
            const farmDataDocRef = doc(db, 'farmData', userData.farmCode);
            
            // Clean up previous listener if exists
            if (farmUnsubscribe) {
              console.log('🔥 REAL-TIME: Cleaning up previous farm listener');
              farmUnsubscribe();
            }
            
            const unsubscribeFarm = onSnapshot(farmDataDocRef, (doc) => {
              if (doc.exists()) {
                const farmData = doc.data();
                console.log('🔥 REAL-TIME: FarmData document updated:', farmData);
                console.log('🔥 REAL-TIME: Cows count in farmData document:', farmData.cows?.length || 0);
                setFarmData(farmData);
              } else {
                console.log('🔥 REAL-TIME: FarmData document does not exist');
                setFarmData(null);
              }
            }, (error) => {
              console.error('❌ REAL-TIME: Error listening to farmData document:', error);
            });
            
            // Store unsubscribe function
            setFarmUnsubscribe(() => unsubscribeFarm);
            
            // Initial load
            const dataResult = await getFarmData(userData.farmCode);
            console.log('🔐 STEP 6: Farm data result:', dataResult);
            
            if (dataResult.success) {
              console.log('🔐 STEP 7: Setting farm data state:', dataResult.data);
              console.log('🔐 STEP 8: Farm profile data:', dataResult.data?.profileData);
              setFarmData(dataResult.data);
              
              // FORCE STATE UPDATE:
              setFarmData(prevState => {
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
          setFarmData(null);
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
      console.log('🔄 FARM SYNC: Current cow count:', cows?.length || 0);
      console.log('🔄 FARM SYNC: Timestamp:', new Date().toISOString());
    }
  }, [farm, cows]);

  const login = async (authData) => {
    setUser(authData.user);
    setFarm(authData.farm);
    
    // Load farm-specific data
    if (authData.user?.farmCode) {
      const dataResult = await getFarmData(authData.user.farmCode);
      if (dataResult.success) {
        setFarmData(dataResult.data);
      }
    }
  };

  const logout = async () => {
    // Clean up farm listener
    if (farmUnsubscribe) {
      console.log('🔥 REAL-TIME: Cleaning up farm listener on logout');
      farmUnsubscribe();
      setFarmUnsubscribe(null);
    }
    
    setUser(null);
    setFarm(null);
    setFarmData(null);
    await logoutUser();
  };

  const updateFarmData = (newData) => {
    setFarmData(prevData => ({
      ...prevData,
      ...newData
    }));
  };

  const updateCows = async (updatedCows) => {
    try {
      console.log('💾 AUTH: Updating cows in farms document (legacy sync)');
      
      if (user?.farmCode) {
        const farmDocRef = doc(db, 'farms', user.farmCode);
        await updateDoc(farmDocRef, {
          cows: updatedCows,
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ AUTH: Farm document updated with', updatedCows.length, 'cows');
        return { success: true };
      } else {
        console.error('❌ AUTH: No farmCode available for cow update');
        return { success: false, error: 'No farmCode available' };
      }
    } catch (error) {
      console.error('❌ AUTH: Error updating cows:', error);
      return { success: false, error: error.message };
    }
  };

  const updateBullInventory = async (newBullInventory) => {
    console.log('🚨 EMERGENCY STOP: updateBullInventory called - checking for infinite loop');
    console.log('💾 FIREBASE SAVE: updateBullInventory called with', newBullInventory.length, 'bulls');
    console.log('🔥 EMERGENCY: Connection status:', navigator.onLine);
    console.log('🔥 EMERGENCY: User authenticated:', !!user);
    console.log('🔥 EMERGENCY: Farm code:', user?.farmCode);
    
    // Update local state
    setFarmData(prevData => {
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
    setFarmData(prevData => {
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

  const refreshFarmData = async () => {
    if (user?.farmCode) {
      console.log('🔄 REFRESH: Loading fresh farm data for code:', user.farmCode);
      const result = await getFarmData(user.farmCode);
      if (result.success) {
        setFarmData(result.data);
        console.log('✅ REFRESH: Fresh farm data loaded with', result.data.cows?.length, 'cows');
      }
    }
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
    refreshFarmData,
    testFirebaseConnection,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 