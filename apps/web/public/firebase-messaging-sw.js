// 🔥 Firebase Cloud Messaging Service Worker
// Handles background web push notifications for bhsedu-e0906

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAezcd-uTdee0jfTqMVKiwJuTcDvel-zUs",
  authDomain: "bhsedu-e0906.firebaseapp.com",
  projectId: "bhsedu-e0906",
  storageBucket: "bhsedu-e0906.firebasestorage.app",
  messagingSenderId: "633292956403",
  appId: "1:633292956403:web:1422729e7d1895a8b60d86"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'স্মার্ট ক্যাম্পাস নোটিফিকেশন';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'একটি জরুরি নোটিশ প্রকাশ করা হয়েছে।',
    icon: payload.notification?.icon || '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    tag: payload.data?.tag || 'school-alert',
    data: {
      url: payload.data?.url || '/dashboard/notices',
      ...payload.data
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
