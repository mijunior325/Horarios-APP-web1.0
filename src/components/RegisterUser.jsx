import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../server/config/FirebaseConfig';
import { createUser } from '../../server/services/userService';

export default function RegisterUser() {
  const { userData } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only admins can see / use this component
  if (userData?.role !== 'admin') {
    return null;
  }

  const clearForm = () => {
    setName('');
    setEmail('');
    setPosition('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setError(null);

    if (!name.trim() || !email.trim() || !position.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (!adminPassword.trim()) {
      setError('Por favor ingresa tu contraseña para confirmar la acción.');
      return;
    }

    const adminEmail = userData?.email || auth.currentUser?.email;

    setLoading(true);
    try {
      const created = await createUser({ name: name.trim(), email: email.trim(), position: position.trim() });

      // After creating a user, Firebase Auth will sign in as that new user.
      // Re-authenticate as the admin so the admin session remains active.
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword.trim());
      } catch (reauthErr) {
        console.error('Error re-authenticating as admin:', reauthErr);
        setStatus(
          `Usuario creado. Inicia sesión nuevamente como administrador para continuar. Contraseña temporal: ${created.password}`
        );
        clearForm();
        return;
      }

      setStatus(
        `Usuario creado con éxito. Contraseña temporal: ${created.password}. Pídeles que la cambien al iniciar sesión.`
      );
      clearForm();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Ocurrió un error al crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-user"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 340,
        zIndex: 10,
      }}
    >
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        style={{ width: '100%' }}
      >
        {showForm ? 'Cerrar registro de usuario' : 'Registrar nuevo usuario'}
      </button>

      {showForm && (
        <div
          className="register-user__form"
          style={{
            marginTop: 12,
            padding: 12,
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>Registrar nuevo usuario</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              value={name}
              placeholder="Nombre completo"
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              value={email}
              placeholder="Correo electrónico"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              value={position}
              placeholder="Posición"
              onChange={(e) => setPosition(e.target.value)}
              required
            />
            <input
              type="password"
              value={adminPassword}
              placeholder="Tu contraseña (admin)"
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>

          {status && <p style={{ color: 'green', marginTop: 8 }}>{status}</p>}
          {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
