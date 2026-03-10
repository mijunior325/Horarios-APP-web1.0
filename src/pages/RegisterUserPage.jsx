import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterUser from '../components/RegisterUser';

export default function RegisterUserPage() {
  // Obtiene la info del usuario autenticado y el estado de carga del auth
  const { userData, loading } = useAuth();

  // Mostrar un indicador mientras se resuelve el estado de auth
  if (loading) {
    return <div style={{ padding: 24 }}>Cargando...</div>;
  }

  // Si no hay usuario autenticado, redirige al login
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // Solo los admins pueden acceder a esta página;
  // el resto se redirige a la pantalla principal (/marcador)
  if (userData.role !== 'admin') {
    return <Navigate to="/marcador" replace />;
  }

  // Si llegamos aquí, el usuario es admin y puede ver el formulario.
  return (
    <div style={{ padding: 24 }}>
      <h1>Registrar nuevo usuario</h1>
      <RegisterUser />
    </div>
  );
}
