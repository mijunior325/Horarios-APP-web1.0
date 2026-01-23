import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../server/config/FIrebaseConfig';



export default function LoginForm({ onLogin, error, setError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User signed in:", user);
      if (setError) setError(null);
      onLogin(user.email);
    } catch (error) {
      console.error("Error signing in:", error);
      if (setError) setError("Correo o contraseña incorrectos.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Iniciar Sesión</h2>
      <input
        type="email"
        placeholder="Correo Electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Iniciar Sesión</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}