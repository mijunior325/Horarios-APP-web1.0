import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { auth } from '../../server/config/FirebaseConfig';
import { createUser } from '../../server/services/userService';
import Input from './Input';


//UI
import { MdPersonAdd } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { IoMdPersonAdd } from "react-icons/io";
import toast from "react-hot-toast";

import Button from './Button';

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

  // Designs for open and close form

  const openFormDesign = " z-10 p-2 rounded-lg text-blue-500 bg-white border border-blue-500 font-bold shadow-lg rounded-xl p-4 cursor-pointer hover:bg-blue-500 hover:text-white transition-colors: duration-200";
  const closeFormDesign = "absolute top-1/4 right-1/8 w-3/4 lg:w-1/4 z-10 p-2 rounded-lg text-white bg-blue-500 shadow-lg transition-colors duration-200";

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
    setAdminPassword('');
  };

  const handleOpenShowForm = () => {
    setStatus(null);
    setError(null);
    setShowForm((v) => !v);
    
  }
  
  const handleCloseShowForm = () => {
    setShowForm(false);
    clearForm();
  }

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
      toast.error('Por favor completa todos los campos.');
      return;
    }

    // La contraseña del admin se usa para volver a autenticarse después de crear el nuevo usuario
    if (!adminPassword.trim()) {
      toast.error('Por favor ingresa tu contraseña para confirmar la acción.');
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
        toast.error(
          `Usuario creado. Inicia sesión nuevamente como administrador para continuar. Contraseña temporal: ${created.password}`
        );
        clearForm();
        return;
      }

      toast.success(
        `Usuario creado con éxito (ID: ${created.id}). Contraseña: ${created.password}. Pídeles que la cambien al iniciar sesión.`
      );
      clearForm();
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error(err.message || 'Ocurrió un error al crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={showForm ? closeFormDesign : openFormDesign}
    >
       {showForm ? (
        <div className='flex flex-row justify-between items-start p-2'>
        <p className="m-0 text-white font-bold">Registrar nuevo usuario</p>
         <IoMdClose size={24} onClick={handleCloseShowForm} className="cursor-pointer" />
      </div> 
      )
      : (
      <MdPersonAdd size={24} onClick={handleOpenShowForm} />)}


      {showForm && (
        <div
          className="flex flex-col gap-2.5 mt-3 p-3 border rounded-lg bg-white shadow"
        >

          
          <div className="flex flex-col gap-2.5">
            <p className="text-black font-bold">Nombre</p>
            <Input
              type="text"
              value={name}
              placeholder="Ejemplo: Juan Pérez"
              onChange={(e) => setName(e.target.value)}
              required
              className="text-black"
            />
            <p className="text-black font-bold">Correo</p>
            <Input
              type="email"
              value={email}
              placeholder="ejemplo@correo.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-black"
            />
            <p className="text-black font-bold">Posición</p>
            <Input
              type="text"
              value={position}
              placeholder="Ejemplo: Gerente, Desarrollador, Analista"
              onChange={(e) => setPosition(e.target.value)}
              required
              className="text-black"
            />
            <p className="text-black font-bold">Departamento</p>
            <Input
              type="text"
              value={department}
              placeholder="Ejemplo: Ventas, IT, RRHH"
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="text-black"
            />
            <p className="text-black font-bold">Contraseña</p>
            <Input
              type="password"
              value={newUserPassword}
              placeholder="Contraseña temporal"
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              className="text-black"
            />
          </div>

            {/* Posiblemente crear admin password para confirmar la creacion */}

            <Button onClick={handleSubmit} label="Submit" icon={<IoMdPersonAdd />} className="bg-blue-500 text-white w-full" />

        </div>
      )}
    </div>
  );
}
