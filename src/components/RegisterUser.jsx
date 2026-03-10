import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../server/config/FirebaseConfig';
import { createUser } from '../../server/services/userService';

// Componente que permite a un admin crear un nuevo usuario en Firebase Auth y Firestore.
//
// Comportamiento:
// - Solo se renderiza para usuarios con role === 'admin'.
// - Muestra un botón que abre/cierra el formulario de registro.
// - Valida los campos obligatorios y pide la contraseña del admin para confirmar la acción.
// - Llama a createUser() de userService para:
//     1) crear un usuario en Firebase Auth con la contraseña ingresada.
//     2) guardar el perfil del usuario en Firestore bajo /users/{uid}.
// - Después de crear el usuario, vuelve a autenticar al admin para mantener la sesión activa.
//
// Datos guardados en Firestore:
//  {
//    id: <uid>,
//    name: ...,        // nombre completo
//    email: ...,       // correo de login
//    position: ...,    // posición (ej. "Desarrollador")
//    dept: ...,        // departamento (almacenado como `dept`)
//    role: ...         // derivado de position ("admin" si position contiene "admin")
//  }

export default function RegisterUser() {
  const { userData } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only admins can see / use this component
  if (userData?.role !== 'admin') {
    return null;
  }

  // Limpia todos los campos del formulario (vuelve a valores iniciales)
  const clearForm = () => {
    setName('');
    setEmail('');
    setPosition('');
    setDepartment('');
    setNewUserPassword('');
  };

  // Maneja el envío del formulario de registro
  // 1) Valida que todos los campos estén completos
  // 2) Llama a createUser() para crear el usuario en Auth + Firestore
  // 3) Vuelve a autenticar al admin para no perder la sesión de administrador
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setError(null);

    // Validación simple de campos requeridos
    if (!name.trim() || !email.trim() || !position.trim() || !department.trim() || !newUserPassword.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    // La contraseña del admin se usa para volver a autenticarse después de crear el nuevo usuario
    if (!adminPassword.trim()) {
      setError('Por favor ingresa tu contraseña para confirmar la acción.');
      return;
    }

    const adminEmail = userData?.email || auth.currentUser?.email;

    setLoading(true);
    try {
      // Crea el nuevo usuario en Firebase (Auth + Firestore)
      const created = await createUser({
        name: name.trim(),
        email: email.trim(),
        position: position.trim(),
        dept: department.trim(),
        password: newUserPassword.trim(),
      });

      // Firebase Auth automáticamente inicia sesión con el nuevo usuario.
      // Re-autenticar al admin para mantener la sesión continua.
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
        `Usuario creado con éxito (ID: ${created.id}). Contraseña: ${created.password}. Pídeles que la cambien al iniciar sesión.`
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
              type="text"
              value={department}
              placeholder="Departamento"
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
            <input
              type="password"
              value={newUserPassword}
              placeholder="Contraseña temporal del nuevo usuario"
              onChange={(e) => setNewUserPassword(e.target.value)}
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
