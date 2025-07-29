importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAUU84n2I30pF18S4fgyFNYCEhX7xb-Ebk",
  authDomain: "cattle-management-app-ae01b.firebaseapp.com",
  projectId: "cattle-management-app-ae01b",
  storageBucket: "cattle-management-app-ae01b.firebasestorage.app",
  messagingSenderId: "442139503127",
  appId: "1:442139503127:web:4f2b632466d844c0f28a52",
  measurementId: "G-S5ZPZVPGR3"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/badge-icon.png',
    data: payload.data,
    click_action: payload.notification.click_action || '/'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 