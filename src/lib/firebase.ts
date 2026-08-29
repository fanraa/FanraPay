import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNAldxBbhWlQtZ9w2N9CIayxndFkIwHDY",
  authDomain: "fanrabank.firebaseapp.com",
  projectId: "fanrabank",
  storageBucket: "fanrabank.firebasestorage.app",
  messagingSenderId: "139789542752",
  appId: "1:139789542752:web:37d1a6d5ea27de9b61ea05",
  measurementId: "G-EBSMQSMCC2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
