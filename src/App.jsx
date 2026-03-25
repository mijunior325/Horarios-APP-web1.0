import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import Marcador from './pages/Marcador';
import LoginForm from './pages/LoginForm';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from "react-hot-toast"
import ImageBackground from "./assets/LoginBackground.png"
  
function AppRoutes() {
  const [loginError, setLoginError] = useState(null);
  const [logoutError, setLogoutError] = useState(null);
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  // Navigate to /marcador when userData is set (user logged in)
  React.useEffect(() => {
    if (userData) {
      navigate('/marcador', { replace: true });
    }
  }, [userData, navigate]);

  const handleLogin = async () => {
    setLoginError(null);
    // userData will be set by AuthContext after successful login
    // Navigation is handled by useEffect
  };

  const handleLogout = () => {
    setLogoutError(null);
    if (logout) logout();
    navigate('/login', { replace: true });
  };

  return (
    <Routes initialPath="/login">
      <Route path="/" element={ userData ? <Navigate to="/marcador" replace /> : <Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <div className="flex items-center justify-center h-screen w-screen bg-white">
            {/* <h1>Marcador de Tiempo de Trabajo</h1> */}
            <LoginForm onLogin={handleLogin} error={loginError} setError={setLoginError} />
          </div>
        }
      />
      <Route path="/marcador" element={<Marcador onLogout={handleLogout} />} />    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
