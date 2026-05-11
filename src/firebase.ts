import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  addDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

// TODO: Replace these with your actual Firebase Project credentials
// 1. Go to Firebase Console -> Project Settings -> General
// 2. Scroll down to "Your apps" and copy the firebaseConfig object
const firebaseConfig = {
  apiKey: "AIzaSyBPSbJSzbHiz_doFMOPoRFTGDzGfuYDJgs",
  authDomain: "isotope-mess-management.firebaseapp.com",
  projectId: "isotope-mess-management",
  storageBucket: "isotope-mess-management.firebasestorage.app",
  messagingSenderId: "248833209335",
  appId: "1:248833209335:web:975617cb4cecd49828b4f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Export auth functions for easier access
export { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
};
