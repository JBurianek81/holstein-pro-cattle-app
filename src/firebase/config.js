import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUU84n2I30pF18S4fgyFNYCEhX7xb-Ebk",
  authDomain: "cattle-management-app-ae01b.firebaseapp.com",
  projectId: "cattle-management-app-ae01b",
  storageBucket: "cattle-management-app-ae01b.firebasestorage.app",
  messagingSenderId: "442139503127",
  appId: "1:442139503127:web:4f2b632466d844c0f28a52",
  measurementId: "G-S5ZPZVPGR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 