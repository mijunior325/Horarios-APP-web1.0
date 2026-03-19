import React, { useState } from 'react';
import { findUserByEmail, findUserById } from '../../server/services/userService';
import Input from '../components/Input';
import LogoCompany from "../assets/LogoCompanySquare.jpg"
import toast from "react-hot-toast";
import { useAuth } from '../context/AuthContext';



export default function LoginForm({ onLogin, error, setError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const signIn = async (email, password) => {
    try {
      await login(email, password);
      toast.success("Sesión iniciada con exito!");
    } catch (error) {
      toast.error("Error signing in:", error);
      if (setError) setError("Correo o contraseña incorrectos.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Attempting to sign in with:", email);
    signIn(email, password);
  };

  return (
    <div className = "flex flex-col justify-center items-center border lg:border-gray-300 md:border-gray-300 border-white bg-white rounded-lg lg:p-8 sm:p-8 lg:py-20 shadow-xl gap-8 lg:w-1/4 md:w-1/2 md:h-auto lg:h-auto h-full w-full px-8" >
        <img className="w-1/2"src={LogoCompany} />
        <span className='text-4xl font-bold'>Iniciar Sesión</span>
        <Input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className='bg-blue-950 text-white font-bold text-xl p-4 w-full rounded-lg' onClick={handleSubmit}>Iniciar Sesión</button>
        {error && <p className="error">{error}</p>}
    </div>
  );
}