import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const checkRedirectLogin = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return result.user;
    }
  } catch (err) {
    console.warn("Redirect auth resolution info:", err);
  }
  return null;
};

export const loginWithGoogle = async () => {
  try {
    // Determine if running in standalone PWA or webview where popup might be blocked
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    );

    if (isStandalone) {
      // In PWA standalone mode, popup windows often get blocked or break session context
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } catch (popupErr: any) {
        console.info("PWA popup failed, initiating redirect sign-in:", popupErr);
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (popupError: any) {
      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.code === 'auth/cancelled-popup-request' ||
        popupError.code === 'auth/popup-closed-by-user'
      ) {
        console.info("Popup blocked or closed, falling back to redirect:", popupError);
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw popupError;
    }
  } catch (error) {
    console.error("Login with Google error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
