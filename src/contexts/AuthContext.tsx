'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  updateProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Add declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface User {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  walletAddress?: string;
  userType?: 'student' | 'recruiter';
  isWeb3Connected?: boolean;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, name: string) => Promise<User | null>;
  logout: () => Promise<void>;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  oauthSignIn: (provider: string) => Promise<void>;
  needsProfileCompletion: boolean;
  getAuthenticatedUserId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Get authenticated user ID from any auth source
  const getAuthenticatedUserId = (): string | null => {
    // Check user state first
    if (user?.id) return user.id;
    
    // Check for wallet authentication
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) return walletAddress;
    
    // Check Firebase auth
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    
    return null;
  };

  // Initialize authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing auth state...');
        
        // Check for wallet authentication first (faster than waiting for Firebase)
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletAddress) {
          console.log('Found wallet authentication:', walletAddress);
          try {
            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', walletAddress));
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              console.log('Found wallet user document:', userData);
              
              const isAdmin = userData.email === 'atul28406@gmail.com';
              const walletUser = {
                ...userData,
                id: walletAddress,
                walletAddress,
                isWeb3Connected: true,
                isAdmin,
              };
              
              setUser(walletUser);
              setIsAdmin(isAdmin);
              setIsAuthenticated(true);
              
              if (!userData.name || !userData.email) {
                setNeedsProfileCompletion(true);
              }
              
              setIsLoading(false);
              return; // Exit early, we're authenticated
            } else {
              console.log('No user document for wallet, creating one');
              // Create a basic user document for the wallet
              await ensureUserDocExists(walletAddress);
              
              setUser({
                id: walletAddress,
                walletAddress,
                isWeb3Connected: true,
                userType: 'student',
                isAdmin: false,
              });
              setIsAuthenticated(true);
              setNeedsProfileCompletion(true);
              setIsLoading(false);
              return; // Exit early, we're authenticated
            }
          } catch (error) {
            console.error('Error checking wallet authentication:', error);
            // Continue to check Firebase auth
          }
        }
      } catch (error) {
        console.error('Error in initial auth check:', error);
      }
      
      // If we get here, no wallet auth or it failed - check Firebase auth
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            console.log('Firebase auth user found:', firebaseUser.uid);
            
            // Fetch user document from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              console.log('Firebase user document found');
              
              const isAdmin = firebaseUser.email === 'atul28406@gmail.com';
              const mergedUser = {
                ...userData,
                id: firebaseUser.uid,
                name: firebaseUser.displayName || userData.name,
                email: firebaseUser.email || userData.email,
                image: firebaseUser.photoURL || userData.image,
                isAdmin,
              };
              
              setUser(mergedUser);
              setIsAdmin(isAdmin);
              setIsAuthenticated(true);
              
              // Check for redirect in session storage
              const redirectPath = sessionStorage.getItem('redirectAfterLogin');
              if (redirectPath) {
                console.log('Redirecting to:', redirectPath);
                sessionStorage.removeItem('redirectAfterLogin');
                router.push(redirectPath);
              } else {
                router.push('/dashboard');
              }
            } else {
              console.log('No user document, creating one for Firebase user');
              const isAdmin = firebaseUser.email === 'atul28406@gmail.com';
              // Create a new user document
              const newUser = {
                name: firebaseUser.displayName,
                email: firebaseUser.email,
                image: firebaseUser.photoURL,
                userType: localStorage.getItem('userType') as 'student' | 'recruiter' || 'student',
                createdAt: new Date(),
                updatedAt: new Date(),
                isAdmin,
              };
              
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              
              setUser({
                ...newUser,
                id: firebaseUser.uid,
                isAdmin,
              });
              setIsAdmin(isAdmin);
              setIsAuthenticated(true);
            }
          } else {
            console.log('No Firebase auth user and no wallet auth');
            // No authenticated user found
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error in Firebase auth state change:', error);
          setUser(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      });
      
      return () => unsubscribe();
    };
    
    initAuth();
  }, []);

  // Sign up with email/password
  const signup = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with name
      await updateProfile(firebaseUser, { displayName: name });
      
      // Store additional user data in Firestore
      const userData = {
        name,
        email,
        userType: localStorage.getItem('userType') as 'student' | 'recruiter' || 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      // Update local user state
      const newUser = {
        id: firebaseUser.uid,
        ...userData
      };
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      localStorage.setItem('userType', localStorage.getItem('userType') || 'student');
      router.push('/dashboard');
      return newUser;
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData: any = {};
      
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        // Create user document if it doesn't exist
        userData = {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          userType: 'student',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      }
      
      const loggedInUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || undefined,
        email: firebaseUser.email || undefined,
        image: firebaseUser.photoURL || undefined,
        userType: userData?.userType || 'student',
        walletAddress: userData?.walletAddress,
        isWeb3Connected: !!userData?.walletAddress,
      };
      
      setUser(loggedInUser);
      setIsAuthenticated(true);
      localStorage.setItem('userType', userData?.userType || 'student');
      
      // Check for redirect in session storage
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        console.log('Redirecting to:', redirectPath);
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
      
      return loggedInUser;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear wallet authentication
      localStorage.removeItem('walletAddress');
      
      // Clear Firebase authentication
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      
      localStorage.removeItem('userType');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    } catch (err: any) {
      console.error('Logout error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // MetaMask connection
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      try {
        // Handle the case where user rejects the connection request
        await provider.send('eth_requestAccounts', []);
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected request
          throw new Error('MetaMask connection was rejected. Please approve the connection request to continue.');
        } else {
          // Other errors
          throw error;
        }
      }
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('Connected to wallet address:', address);

      // Check if this wallet address is already in users collection
      const userRef = doc(db, 'users', address);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // User already exists with this wallet address
        const userData = userDoc.data();
        console.log('Found existing user for wallet address');
        
        const isAdmin = userData.email === 'atul28406@gmail.com';
        const walletUser = {
          id: address,
          walletAddress: address,
          isWeb3Connected: true,
          ...userData,
          isAdmin,
        };
        
        setUser(walletUser);
        setIsAdmin(isAdmin);
        setIsAuthenticated(true);
        localStorage.setItem('walletAddress', address);
        
        if (!userData?.name || !userData?.email) {
          setNeedsProfileCompletion(true);
        } else {
          setNeedsProfileCompletion(false);
        }
        
        // Check for redirectAfterLogin in sessionStorage
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          console.log('Redirecting to:', redirectPath);
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectPath);
        } else {
          router.push('/dashboard');
        }
        
        return address;
      }
      
      // Create new user in users collection
      console.log('Creating new user for wallet address');
      const newWalletUser = {
        walletAddress: address,
        isWeb3Connected: true,
        userType: 'student',
        enrolledCourses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Store in users collection directly
      await setDoc(doc(db, 'users', address), newWalletUser);
      
      setUser({
        id: address,
        walletAddress: address,
        isWeb3Connected: true,
        ...newWalletUser,
        isAdmin: false,
      });
      setIsAuthenticated(true);
      localStorage.setItem('walletAddress', address);
      setNeedsProfileCompletion(true);
      
      // Check for redirectAfterLogin in sessionStorage
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        console.log('Redirecting to:', redirectPath);
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard/profile');
      }
      
      return address;
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      // Format the error message for better user experience
      const errorMessage = err.message && err.message.includes('MetaMask') 
        ? err.message 
        : 'Failed to connect with MetaMask. Please try again.';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to ensure a user document exists for wallet address
  const ensureUserDocExists = async (walletAddress: string) => {
    const userRef = doc(db, 'users', walletAddress);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        walletAddress,
        isWeb3Connected: true,
        enrolledCourses: [],
        userType: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    localStorage.removeItem('walletAddress');
    
    // If user is logged in with wallet, log them out completely
    if (user?.walletAddress) {
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    } else {
      // Just remove wallet connection but keep Firebase auth
      setUser(prev => prev ? { ...prev, walletAddress: undefined, isWeb3Connected: false } : null);
      
      // Update user document if it exists
      if (user?.id) {
        setDoc(doc(db, 'users', user.id), {
          walletAddress: null,
          isWeb3Connected: false,
          updatedAt: new Date()
        }, { merge: true }).catch(err => console.error('Error updating user document:', err));
      }
    }
  };

  // OAuth sign in with Firebase
  const oauthSignIn = async (provider: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let authProvider;
      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider();
          break;
        case 'facebook':
          authProvider = new FacebookAuthProvider();
          break;
        case 'github':
          authProvider = new GithubAuthProvider();
          break;
        case 'twitter':
          authProvider = new TwitterAuthProvider();
          break;
        default:
          throw new Error(`Provider ${provider} is not supported`);
      }
      
      const result = await signInWithPopup(auth, authProvider);
      const firebaseUser = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData: any = {};
      
      if (!userDoc.exists()) {
        // Create new user in Firestore
        userData = {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          image: firebaseUser.photoURL,
          userType: localStorage.getItem('userType') as 'student' | 'recruiter' || 'student',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      } else {
        userData = userDoc.data();
      }
      
      const oauthUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || undefined,
        email: firebaseUser.email || undefined,
        image: firebaseUser.photoURL || undefined,
        userType: userData?.userType || localStorage.getItem('userType') as 'student' | 'recruiter' || 'student',
      };
      
      setUser(oauthUser);
      setIsAuthenticated(true);
      
      // Check for redirect in session storage
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        console.log('Redirecting to:', redirectPath);
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        router.push('/dashboard');
      }
      
      return oauthUser;
    } catch (err: any) {
      console.error(`${provider} sign in error:`, err);
      setError(err.message || `${provider} sign in failed`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    error,
    login,
    signup,
    logout,
    connectWallet,
    disconnectWallet,
    oauthSignIn,
    needsProfileCompletion,
    getAuthenticatedUserId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 