import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { registerUser, loginUser, loginWithGoogle, getCurrentUser, onAuthStateChange } from '../utils/firebaseAuth';
import { syncAllToFirebase, syncAllFromFirebase } from '../utils/firebaseSync';
import { TopNav } from '../components/TopNav';

interface FirebaseAuthProps {
  onBack?: () => void;
  onAuthenticated?: () => void;
}

export const FirebaseAuth: React.FC<FirebaseAuthProps> = ({ onBack, onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { 
    tasks, 
    habits, 
    objectives, 
    keyResults, 
    lifeAreas, 
    timeSlots, 
    friends, 
    statusUpdates,
    userProfile,
    updateUserProfile
  } = useData();

  // Check if user is already authenticated and watch for changes
  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        // Don't call onAuthenticated here - user is already logged in, just viewing the page
      } else {
        setIsAuthenticated(false);
      }
    };

    // Check immediately
    checkAuth();

    // Watch for auth state changes (e.g., login from another device)
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const result = await loginUser(email, password);
        if (result.success && result.user) {
          setSuccess('Successfully logged in!');
          setIsAuthenticated(true);
          
          // Sync data from Firebase
          try {
            const syncResult = await syncAllFromFirebase();
            if (syncResult.success) {
              setSuccess('Logged in and data synced!');
            } else {
              setSuccess('Logged in! (Sync had issues)');
            }
          } catch (syncError: any) {
            setSuccess('Logged in! (Sync error occurred)');
          }
          
          if (onAuthenticated) {
            setTimeout(() => onAuthenticated(), 1000);
          }
        } else {
          console.error('❌ Login failed:', result.error);
          setError(result.error || 'Login failed');
        }
      } else {
        // Register
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const result = await registerUser(email, password);
        if (result.success && result.user) {
          setSuccess('Account created successfully!');
          setIsAuthenticated(true);
          
          // Sync existing local data to Firebase
          const syncResult = await syncAllToFirebase({
            tasks,
            habits,
            objectives,
            keyResults,
            lifeAreas,
            timeSlots,
            friends,
            statusUpdates,
            userProfile
          });
          
          if (syncResult.success) {
            setSuccess('Account created and data synced to cloud!');
          }
          
          if (onAuthenticated) {
            setTimeout(() => onAuthenticated(), 1000);
          }
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      console.log('🔐 Attempting Google login...');
      const result = await loginWithGoogle();
      
      if (result.success && result.user) {
        console.log('✅ Google login successful:', result.user.email);
        setSuccess('Successfully logged in with Google!');
        setIsAuthenticated(true);
        
        // Sync data from Firebase
        try {
          console.log('🔄 Starting sync after Google login...');
          const syncResult = await syncAllFromFirebase();
          if (syncResult.success) {
            console.log('✅ Sync successful after login');
            setSuccess('Logged in and data synced!');
          } else {
            console.warn('⚠️ Sync failed after login:', syncResult.error);
            setSuccess('Logged in! (Sync had issues - check console)');
          }
        } catch (syncError: any) {
          console.error('❌ Sync error after login:', syncError);
          setSuccess('Logged in! (Sync error - check console)');
          // Don't fail login if sync fails
        }
        
        if (onAuthenticated) {
          setTimeout(() => onAuthenticated(), 1000);
        }
      } else {
        console.error('❌ Google login failed:', result.error);
        setError(result.error || 'Google login failed');
      }
    } catch (error: any) {
      console.error('❌ Google login exception:', error);
      setError(error.message || 'An unexpected error occurred during Google login');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    const user = getCurrentUser();
    return (
      <div className="min-h-screen bg-background pb-32 lg:pb-8">
        {onBack && (
          <TopNav 
            title="Cloud Sync" 
            onBack={onBack}
            onMenuClick={() => {}}
            onProfileClick={() => {}}
            showBack={true}
          />
        )}
        <div className="px-4 py-6 max-w-md mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-4">
            <span className="material-symbols-outlined text-green-600 text-5xl mb-4">check_circle</span>
            <h2 className="text-xl font-bold text-green-800 mb-2">Authenticated!</h2>
            <p className="text-green-700 mb-2">Your data is now syncing with the cloud.</p>
            {user && (
              <p className="text-sm text-green-600 mt-2">Logged in as: {user.email}</p>
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-text-main mb-4">Sync Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Authentication</span>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Cloud Sync</span>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Enabled</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to log out? Your data will stop syncing.')) {
                    const { logoutUser } = await import('../utils/firebaseAuth');
                    const result = await logoutUser();
                    if (result.success) {
                      setIsAuthenticated(false);
                      setSuccess('Logged out successfully');
                    } else {
                      setError(result.error || 'Logout failed');
                    }
                  }
                }}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {onBack && (
        <TopNav 
          title="Cloud Sync" 
          onBack={onBack}
          onMenuClick={() => {}}
          onProfileClick={() => {}}
          showBack={true}
        />
      )}
      
      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
          <div className="text-center mb-6">
            <div className="size-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-blue-600 text-4xl">cloud_sync</span>
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-2">
              {isLogin ? 'Login' : 'Create Account'}
            </h2>
            <p className="text-sm text-text-tertiary">
              {isLogin 
                ? 'Login to sync your data across devices' 
                : 'Create an account to backup your data in the cloud'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-text-tertiary">Or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-text-main font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-primary hover:text-primary-dark font-semibold"
            >
              {isLogin 
                ? "Don't have an account? Create one" 
                : "Already have an account? Login"}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-800">
            <strong>💡 Tip:</strong> Your data will be automatically synced to the cloud. 
            You can access it from any device by logging in with the same account.
          </p>
        </div>
      </div>
    </div>
  );
};

