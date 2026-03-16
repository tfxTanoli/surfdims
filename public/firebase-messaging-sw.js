importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
    apiKey: urlParams.get('apiKey'),
    authDomain: `${urlParams.get('projectId')}.firebaseapp.com`,
    projectId: urlParams.get('projectId'),
    storageBucket: `${urlParams.get('projectId')}.firebasestorage.app`,
    messagingSenderId: urlParams.get('messagingSenderId'),
    appId: urlParams.get('appId')
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/favicon-32x32.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
