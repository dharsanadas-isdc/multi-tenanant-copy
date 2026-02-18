
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// In a real production environment, these would be in environment variables.
// For this demonstration, we are using the credentials provided by the user.
const firebaseConfig = {
  apiKey: "AIzaSyA06FZGJAaGf7ihU4vfsbBo0g5c5n9FIQ4",
  authDomain: "trans-scheme-452408-r2.firebaseapp.com",
  projectId: "trans-scheme-452408-r2",
  storageBucket: "trans-scheme-452408-r2.firebasestorage.app",
  messagingSenderId: "1067735875891",
  appId: "1:1067735875891:web:826eed2cc1ab3eb1b93e46"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
