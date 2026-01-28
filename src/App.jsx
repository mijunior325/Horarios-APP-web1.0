import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './App.css';
import Marcador from './pages/Marcador';
import LoginForm from './pages/LoginForm';
import { findUserByEmail } from '../server/services/userService';
import { AuthProvider } from './context/AuthContext';

function AppRoutes() {
  const [loginError, setLoginError] = useState(null);
  const [logoutError, setLogoutError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoginError(null);
    navigate('/marcador');
  }

  const handleLogout = () => {
    setLogoutError(null);
    setUserData(null);
    navigate('/login');
  }

  return (
    <Routes initialPath="/login">
      <Route
        path="/login"
        element={
          <div className="app">
            <h1>Marcador de Tiempo de Trabajo</h1>
            <LoginForm onLogin={handleLogin} error={loginError} setError={setLoginError} />
          </div>
        }
      />
      <Route path="/marcador" element={<Marcador onLogout={handleLogout} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
