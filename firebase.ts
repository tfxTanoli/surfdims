import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app, "surfdims");
const storage = getStorage(app);
const functions = getFunctions(app);

// Messaging Support Check and Initialization
let messaging: any = null;
const messagingReady = isSupported().then((supported) => {
    if (supported) {
        messaging = getMessaging(app);
        console.log("Firebase Messaging supported and initialized.");
        return true;
    }
    console.warn("Firebase Messaging not supported in this browser.");
    return false;
});

export const requestPushToken = async () => {
    try {
        const supported = await messagingReady;
        if (!supported || !messaging) {
            console.error("Messaging not supported or not initialized.");
            return null;
        }

        // Check for Service Worker and Push support
        if (!('serviceWorker' in navigator)) {
            console.error("Service workers are not supported in this browser.");
            return null;
        }

        if (!('PushManager' in window)) {
            console.error("Push messaging is not supported in this browser.");
            return null;
        }
        
        console.log("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        console.log("Permission status:", permission);

        if (permission === 'granted') {
            console.log("Permission granted. Ensuring service worker is registered and ready...");
            
            const swRegistration = await navigator.serviceWorker.register(
                `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&projectId=${firebaseConfig.projectId}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}`
            );

            // Wait until the service worker is ready
            await navigator.serviceWorker.ready;
            console.log("Service worker is ready. Fetching FCM token...");

            const token = await getToken(messaging, { 
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string,
                serviceWorkerRegistration: swRegistration
            });
            console.log("FCM Token generated:", token);
            return token;
        } else {
            console.warn('Notification permission not granted. Status:', permission);
            return null;
        }
    } catch (error: any) {
        console.error('An error occurred while retrieving token:', error);
        if (error.code === 'messaging/permission-blocked') {
            alert("Notification permission was blocked. Please reset permissions in your browser settings.");
        } else if (error.code === 'messaging/failed-service-worker-registration') {
            console.error("Service worker registration failed. Ensure firebase-messaging-sw.js is in the public folder.");
        }
        return null;
    }
};

export const setupOnMessageListener = (callback: (payload: any) => void) => {
    messagingReady.then((supported) => {
        if (supported && messaging) {
            onMessage(messaging, (payload) => {
                callback(payload);
            });
        }
    });
};

export { app, analytics, auth, db, storage, functions, messaging };