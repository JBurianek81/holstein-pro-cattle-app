import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useCattleRealtime = (farmCode, user) => {
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmCode || !user) {
      console.log('🔍 CATTLE HOOK: No farmCode or user, skipping listener');
      setCows([]);
      setLoading(false);
      return;
    }

    console.log('🔍 CATTLE HOOK: Setting up real-time listener for farmCode:', farmCode);
    
    // Create real-time listener for farm's cattle
    const q = query(
      collection(db, 'cattle'),
      where('farmCode', '==', farmCode),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cattleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('🐄 REAL-TIME: Cattle data updated:', cattleData.length, 'cows');
      console.log('🐄 REAL-TIME: Cow IDs:', cattleData.map(cow => cow.tagNumber));
      
      setCows(cattleData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Real-time cattle listener error:', error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔍 CATTLE HOOK: Cleaning up real-time listener');
      unsubscribe();
    };
  }, [farmCode, user]);

  return { cows, loading };
}; 