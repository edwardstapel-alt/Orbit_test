// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqPY_IS9MUs8RaQfQMR6cHW_SVjpuJ5Lk",
  authDomain: "orbit-e1a7e.firebaseapp.com",
  projectId: "orbit-e1a7e",
  storageBucket: "orbit-e1a7e.firebasestorage.app",
  messagingSenderId: "658270934898",
  appId: "1:658270934898:web:c502669db7aabef7caefeb",
  measurementId: "G-GMNS1ZFHJG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser, not in SSR)
let analytics: any = null;
if (typeof window !== 'undefined') {
  try {
    // Only initialize analytics if not already initialized
    if (!analytics) {
      analytics = getAnalytics(app);
    }
  } catch (error: any) {
    // Analytics might fail if already initialized or in development
    if (error.code !== 'already-initialized') {
      console.warn('Analytics initialization failed:', error);
    }
    analytics = null;
  }
}

export { analytics };

