
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../server/config/FirebaseConfig';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { findUserById } from '../../server/services/userService';
import toast from "react-hot-toast";

// Create the AuthContext
const AuthContext = createContext();

// AuthProvider component to wrap your app
export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [userData, setUserData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Listen for Firebase Auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);
			if (firebaseUser) {
				try {
					const data = await findUserById(firebaseUser.uid);
					setUserData(data || null);
				} catch (err) {
					setUserData(null);
				}
			} else {
				setUserData(null);
			}
			setLoading(false);
		});
		return () => unsubscribe();
	}, []);

	// Login with Firebase Auth
	const login = async (email, password) => {
		setError(null);
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			setUser(userCredential.user);
			// toast.success("Sesión iniciada correctamente!");
			return userCredential.user;
		} catch (err) {
			// toast.error("Error al iniciar sesión:", err);
			setError(err.message);
			throw err;
		}
	};

	// Logout with Firebase Auth
	const logout = async () => {
		setError(null);
		try {
			await signOut(auth);
			setUser(null);
			setUserData(null);
		} catch (err) {
			setError(err.message);
			throw err;
		}
	};

	return (
		<AuthContext.Provider value={{ user, userData, login, logout, loading, error }}>
			{children}
		</AuthContext.Provider>
	);
}

// Custom hook for easy access
export function useAuth() {
	return useContext(AuthContext);
}
