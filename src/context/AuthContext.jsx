import { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, getAdditionalUserInfo } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { sendWelcomeEmail } from '../utils/brevo';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Create/Update user document in Firestore
            const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp(),
                    bio: '',
                    followers: [],
                    following: []
                });
                await sendWelcomeEmail(user.email, user.displayName);
            } else {
                // Optional: Update detailed fields if needed on login, for now keep static to avoid overwriting custom bio
                // contrasting to "google default" request: user might want to keep custom name/photo
            }

        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        logout,
        updateUserProfile: async (data) => {
            if (auth.currentUser) {
                const { updateProfile } = await import('firebase/auth');
                await updateProfile(auth.currentUser, data);
                setUser({ ...auth.currentUser, ...data });
            }
        },
        deleteAccount: async () => {
            if (auth.currentUser) {
                const { deleteUser } = await import('firebase/auth');
                const { doc, deleteDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase');

                const uid = auth.currentUser.uid;

                // 1. Delete Firestore document
                await deleteDoc(doc(db, 'users', uid));

                // 2. Delete Firebase Auth account
                await deleteUser(auth.currentUser);
                setUser(null);
            }
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
