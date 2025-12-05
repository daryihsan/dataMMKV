// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from "firebase/firestore"; // Import Firestore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; // Import Auth
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'firebase-auth-storage'
});

console.log("firebaseConfig: MMKV initialized with id 'firebase-auth-storage'");
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNixKnsNFcFWuzHK_7piTiLLcvzaGCl9A",
  authDomain: "fir-storsan.firebaseapp.com",
  projectId: "fir-storsan",
  storageBucket: "fir-storsan.firebasestorage.app",
  messagingSenderId: "283070763494",
  appId: "1:283070763494:web:f91ad382acd70a51f14627"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = initializeAuth(app, {
    // Gunakan MMKV untuk persistence
    persistence: getReactNativePersistence(storage)
});

// Initialize Firestore
export const db = getFirestore(app); // Export Firestore instance
