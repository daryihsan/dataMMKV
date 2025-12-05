import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, storage } from './firebaseConfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticatedWithFirebase: boolean; // Flag untuk track real Firebase auth
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticatedWithFirebase, setIsAuthenticatedWithFirebase] = useState(false); // Track real auth

  useEffect(() => {
    console.log("AuthProvider: Starting initialization...");
    
    // Check MMKV saat initialize
    const savedUserId = storage.getString("userId");
    const savedEmail = storage.getString("userEmail");
    console.log("AuthProvider: MMKV data on init -> userId:", savedUserId, "email:", savedEmail);
    
    let isFirstCall = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeFromAuth: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        console.log("AuthProvider: Waiting for auth.authStateReady()...");
        await auth.authStateReady();
        console.log("AuthProvider: auth.authStateReady() complete!");
        
        // Check current user dari Firebase
        const currentUser = auth.currentUser;
        console.log("AuthProvider: auth.currentUser =", currentUser?.uid);
        
        if (currentUser) {
          // Firebase berhasil restore user
          console.log("AuthProvider: Firebase restored user from persistence");
          setUser(currentUser);
          setIsAuthenticatedWithFirebase(true);
          if (isFirstCall) {
            isFirstCall = false;
            setIsInitialized(true);
            setIsLoading(false);
            if (timeoutId) clearTimeout(timeoutId);
          }
        } else if (savedUserId) {
          // Firebase tidak restore, tapi ada data di MMKV
          // Coba auto-login dengan saved credentials
          console.log("AuthProvider: Firebase tidak restore, coba auto-login dengan saved credentials...");
          const savedPassword = storage.getString("userPassword");
          
          if (savedEmail && savedPassword) {
            try {
              console.log("AuthProvider: Auto-login dengan email:", savedEmail);
              const userCredential = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
              const user = userCredential.user;
              
              console.log("AuthProvider: Auto-login berhasil, uid =", user.uid);
              setUser(user);
              setIsAuthenticatedWithFirebase(true);
              
              if (isFirstCall) {
                isFirstCall = false;
                setIsInitialized(true);
                setIsLoading(false);
                if (timeoutId) clearTimeout(timeoutId);
              }
            } catch (autoLoginError) {
              console.log("AuthProvider: Auto-login gagal:", autoLoginError);
              // Auto-login gagal, akan gunakan fallback nanti
            }
          }
        }
      } catch (error) {
        console.log("AuthProvider: authStateReady error:", error);
      }
    };

    // Subscribe ke Firebase Auth state changes
    unsubscribeFromAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("AuthProvider: onAuthStateChanged dipanggil, user =", currentUser?.uid, "isFirstCall =", isFirstCall);

      if (currentUser) {
        // Ada user yang login dari Firebase (bukan fallback!)
        console.log("AuthProvider: User login dari Firebase, uid =", currentUser.uid);
        storage.set("userId", currentUser.uid);
        storage.set("userEmail", currentUser.email || "");
        setUser(currentUser);
        setIsAuthenticatedWithFirebase(true); // Mark as real Firebase auth
        
        if (isFirstCall) {
          isFirstCall = false;
          console.log("AuthProvider: Marking isInitialized = true (dari onAuthStateChanged)");
          setIsInitialized(true);
          setIsLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } else {
        // Tidak ada user
        if (!isFirstCall) {
          // Ini adalah truly logout (bukan first initialization)
          console.log("AuthProvider: User logout, hapus MMKV");
          storage.remove("userId");
          storage.remove("userEmail");
        } else {
          // First call dan user undefined
          console.log("AuthProvider: First init dengan user undefined");
        }
        setUser(null);
      }
    });

    // Initialize auth async
    initializeAuth();

    // FALLBACK: Jika Firebase tidak emit callback dalam 3 detik, gunakan MMKV
    timeoutId = setTimeout(() => {
      if (isFirstCall) {
        console.log("AuthProvider: FALLBACK TIMEOUT - Firebase tidak restore user, gunakan MMKV fallback");
        
        if (savedUserId) {
          console.log("AuthProvider: Found savedUserId in MMKV, create minimal user object as fallback");
          
          const minimalUser = {
            uid: savedUserId,
            email: savedEmail || null,
            displayName: null,
            photoURL: null,
            emailVerified: false,
            isAnonymous: false,
            phoneNumber: null,
          } as any;
          
          console.log("AuthProvider: Setting user from MMKV fallback");
          setUser(minimalUser);
          setIsAuthenticatedWithFirebase(false); // Mark as fallback
        }
        
        isFirstCall = false;
        console.log("AuthProvider: Marking isInitialized = true (dari FALLBACK)");
        setIsInitialized(true);
        setIsLoading(false);
      }
    }, 3000); // 3 detik timeout

    // Cleanup
    return () => {
      console.log("AuthProvider: Cleanup - unsubscribe");
      if (unsubscribeFromAuth) unsubscribeFromAuth();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitialized, isAuthenticatedWithFirebase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
