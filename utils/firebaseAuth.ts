// Firebase Authentication helpers
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';

// Register new user
export const registerUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    return { success: false, error: errorMessage };
  }
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later';
    }
    return { success: false, error: errorMessage };
  }
};

// Login with Google
export const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Google login error:', error);
    let errorMessage = 'Google login failed';
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Login popup was closed';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Login was cancelled';
    }
    return { success: false, error: errorMessage };
  }
};

// Logout user
export const logoutUser = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Watch auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

