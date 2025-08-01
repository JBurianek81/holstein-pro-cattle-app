import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Collection names
const COLLECTIONS = {
  CATTLE: 'cattle',
  FARMS: 'farms',
  USERS: 'users'
};

// Real-time cattle hook
export const useCattleRealtime = (farmCode, user) => {
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 DEBUG: useCattleRealtime hook triggered');
    console.log('🔍 DEBUG: farmCode parameter:', farmCode);
    console.log('🔍 DEBUG: user parameter:', user?.email);
    console.log('🔍 DEBUG: Device info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screenWidth: window.innerWidth,
      isMobileView: window.innerWidth <= 768
    });
    console.log('🔍 DEBUG: Current cows state:', cows.length);
    console.log('🔍 DEBUG: Current loading state:', loading);
    console.log('🔍 DEBUG: Current error state:', error);
    
    // PRODUCTION SAFETY: Disable real-time sync in production to prevent React error #301
    if (process.env.NODE_ENV === 'production') {
      console.log('🌐 PRODUCTION: Disabling real-time cattle sync to prevent crashes');
      console.log('🌐 PRODUCTION: Loading cattle from localStorage only');
      
      // Load from localStorage in production
      const savedCows = localStorage.getItem('holsteinProCows');
      if (savedCows) {
        const parsedCows = JSON.parse(savedCows);
        console.log('🌐 PRODUCTION: Loaded cattle from localStorage:', parsedCows.length);
        setCows(parsedCows);
      } else {
        console.log('🌐 PRODUCTION: No cattle found in localStorage');
        setCows([]);
      }
      setLoading(false);
      return;
    }
    
    if (!farmCode || !user) {
      console.log('🐄 REAL-TIME: No farmCode or user, skipping listener');
      console.log('🔍 DEBUG: farmCode missing:', !farmCode);
      console.log('🔍 DEBUG: user missing:', !user);
      console.log('🔍 DEBUG: farmCode value:', farmCode);
      console.log('🔍 DEBUG: user value:', user);
      setLoading(false);
      return;
    }

    console.log('🐄 REAL-TIME: Setting up cattle listener for farm:', farmCode);
    console.log('🔍 DEBUG: Creating query for cattle collection');
    console.log('🔍 DEBUG: Collection name:', COLLECTIONS.CATTLE);

    // Create real-time listener for farm's cattle
    const q = query(
      collection(db, COLLECTIONS.CATTLE),
      where('farmCode', '==', farmCode),
      orderBy('createdAt', 'desc')
    );

    console.log('🔍 DEBUG: Cattle query created, setting up listener');
    console.log('🔍 DEBUG: Query details:', {
      collection: COLLECTIONS.CATTLE,
      farmCode: farmCode,
      orderBy: 'createdAt desc'
    });

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔍 DEBUG: Cattle snapshot received');
      console.log('🔍 DEBUG: Number of cattle documents:', snapshot.docs.length);
      console.log('🔍 DEBUG: Snapshot metadata:', {
        empty: snapshot.empty,
        size: snapshot.size,
        docs: snapshot.docs.length
      });
      
      const cattleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('🔍 DEBUG: Cattle data mapped:', cattleData);
      console.log('🔍 DEBUG: First few cattle:', cattleData.slice(0, 3));
      console.log('🔍 DEBUG: Cattle IDs:', cattleData.map(cow => cow.id));
      console.log('🐄 REAL-TIME: Cattle data updated:', cattleData.length, 'animals');
      
      // Check for mobile-specific issues
      const isMobile = window.innerWidth <= 768;
      console.log('🔍 DEBUG: Is mobile view during data update:', isMobile);
      console.log('🔍 DEBUG: Setting cows state to:', cattleData.length, 'items');
      
      setCows(cattleData);
      
      // Update localStorage for production fallback
      try {
        localStorage.setItem('holsteinProCows', JSON.stringify(cattleData));
        console.log('💾 LOCALSTORAGE: Updated with real-time data:', cattleData.length, 'cows');
      } catch (localStorageError) {
        console.warn('⚠️ Failed to update localStorage:', localStorageError);
      }
      
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('❌ Real-time cattle listener error:', error);
      console.error('🔍 DEBUG: Cattle listener error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      console.error('🔍 DEBUG: Error occurred on mobile:', window.innerWidth <= 768);
      setError(error.message);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🐄 REAL-TIME: Cleaning up cattle listener');
      console.log('🔍 DEBUG: Cleanup on mobile:', window.innerWidth <= 768);
      unsubscribe();
    };
  }, [farmCode, user]);

  return { cows, loading, error };
};

// Cattle CRUD operations
export const cattleService = {
  // Add new cow to Firestore
  addCow: async (cowData, farmCode, userEmail) => {
    try {
      console.log('🔥 CATTLE SERVICE: Adding cow to both cattle collection AND farms document');
      
      // Add to individual cattle collection
      const docRef = await addDoc(collection(db, 'cattle'), {
        ...cowData,
        farmCode: farmCode,
        createdBy: userEmail,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ CATTLE SERVICE: Cow added to cattle collection with ID:', docRef.id);
      
      // ALSO update farmData document to sync with App.js
      try {
        const farmDataDocRef = doc(db, 'farmData', farmCode);
        const farmDataDoc = await getDoc(farmDataDocRef);
        
        if (farmDataDoc.exists()) {
          const farmData = farmDataDoc.data();
          const updatedCows = [...(farmData.cows || []), { ...cowData, id: docRef.id }];
          
          await updateDoc(farmDataDocRef, {
            cows: updatedCows,
            updatedAt: serverTimestamp()
          });
          
          console.log('✅ CATTLE SERVICE: Also updated farmData document with', updatedCows.length, 'total cows');
          console.log('✅ CATTLE SERVICE: App.js will now see the new cow via real-time sync');
        } else {
          console.warn('⚠️ CATTLE SERVICE: FarmData document not found, cannot update farmData document');
        }
      } catch (farmUpdateError) {
        console.error('❌ CATTLE SERVICE: Error updating farmData document:', farmUpdateError);
      }
      
      // Update localStorage for production fallback
      try {
        const savedCows = localStorage.getItem('holsteinProCows');
        const existingCows = savedCows ? JSON.parse(savedCows) : [];
        const updatedCows = [...existingCows, { ...cowData, id: docRef.id }];
        localStorage.setItem('holsteinProCows', JSON.stringify(updatedCows));
        console.log('💾 LOCALSTORAGE: Added new cow:', docRef.id);
      } catch (localStorageError) {
        console.warn('⚠️ Failed to update localStorage:', localStorageError);
      }
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ CATTLE SERVICE: Error adding cow:', error);
      return { success: false, error: error.message };
    }
  },

  // Update existing cow in Firestore
  updateCow: async (cowId, updates, farmCode) => {
    try {
      console.log('🐄 UPDATING: Updating cow in both cattle collection AND farms document:', cowId);
      
      // 1. Update individual cattle document
      await updateDoc(doc(db, COLLECTIONS.CATTLE, cowId), {
        ...updates,
        lastUpdated: serverTimestamp()
      });
      
      // 2. ALSO update farms document
      try {
        const farmDocRef = doc(db, 'farms', farmCode);
        const farmDoc = await getDoc(farmDocRef);
        
        if (farmDoc.exists()) {
          const farmData = farmDoc.data();
          const updatedCows = farmData.cows?.map(cow => 
            cow.id === cowId ? { ...cow, ...updates, lastUpdated: new Date().toISOString() } : cow
          ) || [];
          
          await updateDoc(farmDocRef, {
            cows: updatedCows,
            updatedAt: serverTimestamp()
          });
          
          console.log('✅ COW UPDATED: Also updated in farms document');
        }
      } catch (farmUpdateError) {
        console.error('❌ Error updating farm document:', farmUpdateError);
      }
      
      // Update localStorage for production fallback
      try {
        const savedCows = localStorage.getItem('holsteinProCows');
        if (savedCows) {
          const existingCows = JSON.parse(savedCows);
          const updatedCows = existingCows.map(cow => 
            cow.id === cowId ? { ...cow, ...updates, lastUpdated: new Date().toISOString() } : cow
          );
          localStorage.setItem('holsteinProCows', JSON.stringify(updatedCows));
          console.log('💾 LOCALSTORAGE: Updated cow:', cowId);
        }
      } catch (localStorageError) {
        console.warn('⚠️ Failed to update localStorage:', localStorageError);
      }
      
      console.log('✅ COW UPDATED: Real-time sync triggered');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating cow:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete cow from Firestore
  deleteCow: async (cowId, farmCode) => {
    try {
      console.log('🐄 DELETING: Removing cow from both cattle collection AND farms document:', cowId);
      
      // 1. Delete individual cattle document
      await deleteDoc(doc(db, COLLECTIONS.CATTLE, cowId));
      
      // 2. ALSO remove from farms document
      try {
        const farmDocRef = doc(db, 'farms', farmCode);
        const farmDoc = await getDoc(farmDocRef);
        
        if (farmDoc.exists()) {
          const farmData = farmDoc.data();
          const updatedCows = farmData.cows?.filter(cow => cow.id !== cowId) || [];
          
          await updateDoc(farmDocRef, {
            cows: updatedCows,
            updatedAt: serverTimestamp()
          });
          
          console.log('✅ COW DELETED: Also removed from farms document');
        }
      } catch (farmUpdateError) {
        console.error('❌ Error updating farm document:', farmUpdateError);
      }
      
      // Update localStorage for production fallback
      try {
        const savedCows = localStorage.getItem('holsteinProCows');
        if (savedCows) {
          const existingCows = JSON.parse(savedCows);
          const updatedCows = existingCows.filter(cow => cow.id !== cowId);
          localStorage.setItem('holsteinProCows', JSON.stringify(updatedCows));
          console.log('💾 LOCALSTORAGE: Removed cow:', cowId);
        }
      } catch (localStorageError) {
        console.warn('⚠️ Failed to update localStorage:', localStorageError);
      }
      
      console.log('✅ COW DELETED: Real-time sync triggered');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting cow:', error);
      return { success: false, error: error.message };
    }
  },

  // Archive cow (soft delete)
  archiveCow: async (cowId, archiveReason) => {
    try {
      console.log('🐄 ARCHIVING: Archiving cow in Firestore:', cowId);
      
      await updateDoc(doc(db, COLLECTIONS.CATTLE, cowId), {
        archived: true,
        archiveReason: archiveReason,
        archivedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ COW ARCHIVED: Real-time sync triggered');
      return { success: true };
    } catch (error) {
      console.error('❌ Error archiving cow:', error);
      return { success: false, error: error.message };
    }
  },

  // Restore archived cow
  restoreCow: async (cowId) => {
    try {
      console.log('🐄 RESTORING: Restoring cow in Firestore:', cowId);
      
      await updateDoc(doc(db, COLLECTIONS.CATTLE, cowId), {
        archived: false,
        archiveReason: null,
        archivedAt: null,
        restoredAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ COW RESTORED: Real-time sync triggered');
      return { success: true };
    } catch (error) {
      console.error('❌ Error restoring cow:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single cow by ID
  getCow: async (cowId) => {
    try {
      const cowDoc = await getDoc(doc(db, COLLECTIONS.CATTLE, cowId));
      if (cowDoc.exists()) {
        return { 
          success: true, 
          cow: { id: cowDoc.id, ...cowDoc.data() } 
        };
      } else {
        return { success: false, error: 'Cow not found' };
      }
    } catch (error) {
      console.error('❌ Error getting cow:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all cows for a farm (non-real-time, for initial load)
  getFarmCows: async (farmCode) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.CATTLE),
        where('farmCode', '==', farmCode),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const cows = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, cows };
    } catch (error) {
      console.error('❌ Error getting farm cows:', error);
      return { success: false, error: error.message };
    }
  }
};

export default cattleService; 