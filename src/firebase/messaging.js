import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from './config'; // Import the already initialized app

const messaging = getMessaging(app);

const VAPID_KEY = 'BDCzktIy5z9TG8wgDdfxqUzfjYMndm4oSyHW8QtIrqES4WMuaJqpbz6fIogUv61rd-fW3gHQtp6Kxen4Uok8HJM';

// Check if device is iOS
const isIOS = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const maxTouchPoints = navigator.maxTouchPoints;
  
  console.log('🔍 iOS Detection Debug:');
  console.log('🔍 User Agent:', userAgent);
  console.log('🔍 Platform:', platform);
  console.log('🔍 Max Touch Points:', maxTouchPoints);
  
  return /iPad|iPhone|iPod/.test(userAgent) || 
         (platform === 'MacIntel' && maxTouchPoints > 1);
};

export const requestNotificationPermission = async () => {
  try {
    console.log('Requesting notification permission...');
    
    // Check if it's iOS
    if (isIOS()) {
      console.log('iOS device detected - FCM not supported, using browser notifications');
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Browser notification permission granted for iOS');
        return 'ios-browser-notifications'; // Special token for iOS
      } else {
        console.log('Browser notification permission denied for iOS');
        return null;
      }
    }
    
    // For non-iOS devices, use FCM
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (token) {
        console.log('FCM Registration Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });

export { messaging }; 