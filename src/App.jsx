import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './App.css';
import Marcador from './pages/Marcador';
import LoginForm from './pages/LoginForm';



function AppRoutes() {
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (userEmail) => {
    setLoginError(null);
    navigate('/marcador');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app">
            <h1>Marcador de Tiempo de Trabajo</h1>
            <LoginForm onLogin={handleLogin} error={loginError} setError={setLoginError} />
          </div>
        }
      />
      <Route path="/marcador" element={<Marcador />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
