import React, { useState } from 'react'
import Historial from './Historial'
import { signOut } from 'firebase/auth';
import { auth } from '../../server/config/FIrebaseConfig';
import { useNavigate } from 'react-router-dom';
import { closeTimeShift, createTimeShift, getOpenTimeShiftByUser, openLunchShift, closeLunchShift } from '../../server/services/timeShiftService';
import { useAuth } from '../context/AuthContext';


export default function Marcador({ allUsers, getRecords }) {
  const [entradaTurno, setEntradaTurno] = useState(null);
  const [entradaLunch, setEntradaLunch] = useState(null);
  const [salidaLunch, setSalidaLunch] = useState(null);
  const [salidaTurno, setSalidaTurno] = useState(null);
  const [open, setOpen] = useState(false);
  const [openLunch, setOpenLunch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { logout, userData } = useAuth();
  const [selectedUser, setSelectedUser] = useState(userData?.name || userData?.email || '');
  const navigate = useNavigate();

  // Use id from userData for time shift operations
  const userId = userData?.id || userData?.uid || null;

  const marcarEntradaTurno = () => {
    console.log("Pressed marcarEntradaTurno");
    console.log("userId:", userId);
    if (!userId) return;
    console.log("Marcando entrada al turno");
    createTimeShift(userId).then((data) => {
      console.log("Time shift created:", data);
      setEntradaTurno(new Date());
      setSalidaTurno(null);
      setEntradaLunch(null);
      setSalidaLunch(null);
      setOpen(true);

    }).catch((error) => {
      console.error("Error creating time shift:", error);
    });
  };

  const marcarEntradaLunch = () => {
    if (!open) return;
    console.log("Marcando Entrada al Lunch");
    const LunchInDate = new Date();
    getOpenTimeShiftByUser(userId).then(openShift => {
      if (!openShift) {
        console.error("No open shift found for user.");
        return;
      }
      openLunchShift(openShift.id, LunchInDate).then((data) => {
        console.log("Lunch shift opened:", data);
        setOpenLunch(true);
        setEntradaLunch(LunchInDate);
      }).catch((error) => {
        console.error("Error opening lunch shift:", error);
      });
    });
  };

  const marcarSalidaLunch = () => {
    if (!open || !openLunch) return;
    console.log("Marcando Salida del Lunch");
    const LunchOutDate = new Date();
    getOpenTimeShiftByUser(userId).then(openShift => {
      if (!openShift) {
        console.error("No open shift found for user.");
        return;
      }
      closeLunchShift(openShift.id, LunchOutDate).then((data) => {
        console.log("Lunch shift closed:", data);
        setOpenLunch(false);
        setSalidaLunch(LunchOutDate);
      }).catch((error) => {
        console.error("Error closing lunch shift:", error);
      });
    });
  };

const marcarSalidaTurno = () => {
  if (!userId) return;
  const punchOutDate = new Date();
  getOpenTimeShiftByUser(userId).then(openShift => {
    if (!openShift) {
      console.error("No open shift found for user.");
      return;
    }
    closeTimeShift(openShift.id, punchOutDate).then((data) => {
      console.log("Time shift closed:", data);
      setOpen(false);
      setSalidaTurno(punchOutDate);
    }).catch((error) => {
      console.error("Error closing time shift:", error);
    });
  });
};

  const handleLogout = async () => {
    await logout();
    console.log("User signed out successfully.");
    navigate('/login');
  };

  return (
    <div className="marcador">
      <h1>Marcador de Tiempo de Trabajo</h1>
      <p>Bienvenido, { userData?.name || `Usuario`}</p>
      <button onClick={handleLogout} className="logout">Cerrar Sesión</button>
      <div className="botones">
        <button onClick={marcarEntradaTurno} disabled={entradaTurno !== null}>
          Entrada al Turno
        </button>
        <button onClick={marcarEntradaLunch} disabled={openLunch === true || open === false}>
          Entrada al Lunch
        </button>
        <button onClick={marcarSalidaLunch} disabled={openLunch === false || open === false}>
          Salida del Lunch
        </button>
        <button onClick={marcarSalidaTurno} disabled={open === false || openLunch === true}>
          Salida de Turno
        </button>
      </div>
      <div className="registros">
        <h2>Registros de Hoy</h2>
        <p>Entrada al Turno: {entradaTurno ? entradaTurno.toLocaleString() : 'No marcado'}</p>
        <p>Entrada al Lunch: {entradaLunch ? entradaLunch.toLocaleString() : 'No marcado'}</p>
        <p>Salida del Lunch: {salidaLunch ? salidaLunch.toLocaleString() : 'No marcado'}</p>
        <p>Salida de Turno: {salidaTurno ? salidaTurno.toLocaleString() : 'No marcado'}</p>
      </div>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
      </button>
      {showHistory && (
        <div className="historial">
          {userData?.role === 'admin' ? (
            <div>
              <h3>Seleccionar Usuario</h3>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                {allUsers().map(u => <option key={u.id || u.email} value={u.id || u.email}>{u.name || u.email}</option>)}
              </select>
              <Historial records={getRecords(selectedUser)} username={selectedUser} />
            </div>
          ) : (
            <Historial records={getRecords(userId)} username={userData?.name || `Usuario`} />
          )}
        </div>
      )}
    </div>
  )
}