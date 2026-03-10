import React, { useState } from 'react'
import Historial from './Historial'
import { signOut } from 'firebase/auth';
import { auth } from '../../server/config/FirebaseConfig';
import { useNavigate } from 'react-router-dom';
import { closeTimeShift, createTimeShift, getOpenTimeShiftByUser, openLunchShift, closeLunchShift } from '../../server/services/timeShiftService';
import { useAuth } from '../context/AuthContext';
import CalendarDb from '../components/Calendardb';
import RegisterUser from '../components/RegisterUser';
import { MdOutlineLogout } from "react-icons/md";



//UI Imports
import { FcAssistant } from "react-icons/fc";
import { MdOutlinePunchClock, MdOutlineLunchDining } from "react-icons/md";
import Button from "../components/Button"
import InfoCard from '../components/InfoCard';


export default function Marcador({ allUsers, getRecords }) {
  const [entradaTurno, setEntradaTurno] = useState(null);
  const [entradaLunch, setEntradaLunch] = useState(null);
  const [salidaLunch, setSalidaLunch] = useState(null);
  const [salidaTurno, setSalidaTurno] = useState(null);
  const [displayCalendar, setDisplayCalendar] = useState(false);
  const [open, setOpen] = useState(false);
  const [openLunch, setOpenLunch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { logout, userData } = useAuth();
  const [selectedUser, setSelectedUser] = useState(userData?.name || userData?.email || '');
  const navigate = useNavigate();

  // Use id from userData for time shift operations
  const userId = userData?.id || userData?.uid || null;


  ////FUNCTIONS//////

    const [time, setTime] = useState(new Date());

    React.useEffect(() => {
      const timer = setInterval(() => {
        setTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }, []);


  // handle time shift actions

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

  const handleShowCalendar = () => { 
    setDisplayCalendar(!displayCalendar);
  };


  return (
    <div className="flex flex-col gap-10 justify-start min-h-screen bg-gray-50">
      {/* Top Nav Bar */}
      <div className="w-full flex flex-row justify-between p-8 xl:px-30 md:px-8 bg-white shadow-md items-center">

        {/* Profile View */}
        <div className="flex items-center gap-4">

          {/* Icon */}
          <FcAssistant size={48} />

          {/* User Info Text */}
          <div className='flex flex-col gap-1'>
            <p className='font-bold text-xl text-gray-800'>{ userData?.name || `Usuario`}</p>
            <p className='text-sm font-bold flex justify-start items-start text-blue-500'>{ userData?.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
          </div>
        </div>

        {/* Logout Button */}
        <div className= "flex flex-row gap-2 item-center justify-center text-red-500 bg-white border border-red-500 font-bold shadow-lg rounded-xl p-4 cursor-pointer hover:bg-red-500 hover:text-white transition-colors: duration-200" onClick={handleLogout}>
          <MdOutlineLogout size={24} />
          {/* <p>Cerrar Sesión</p> */}

          {/* {userData?.role === 'admin' && <RegisterUser />} */}
        </div>
      </div>
      
    {/* Body */}
      <div className="flex flex-col p-8 xl:px-30 md:px-8 sm:px-8 gap-10">
        {/* section top text */}
        <div className='flex flex-row justify-beteen w-full'>
          <div className="flex flex-col gap-2">
            <p className="text-4xl text-black font-bold">Bienvenido!</p>
            <p className="text-2xl text-gray-500">{time.toLocaleTimeString()}</p>
            <p className="text-2xl text-gray-500">{time.toDateString()}</p>
          </div>

        </div>

        {/* Main marcador */}
        <div className ="flex flex-col border border-black w-full bg-white rounded-xl shadow-lg p-8 gap-6">

            {/* Text Info Marcador */}
            <div className='flex flex-col items-start justify-start gap-2'>
              <p className="text-3xl text-black font-bold">Marcador</p>
              <p className="text-xl text-gray-400">Aquí puede marcar sus tiempos</p>
            </div>
            {/* Button Section Marcador */}
          <div className="w-full flex lg:flex-row md:flex-col flex-col gap-4 justify-center items-center">
            <Button label="Entrar al Turno" onClick={marcarEntradaTurno} disabled={entradaTurno !== null} className="bg-green-500 hover:bg-green-700" icon={<MdOutlinePunchClock size={42}/>}/>
            <Button label="Entrar al Lunch" onClick={marcarEntradaLunch} disabled={openLunch === true || open === false} className="bg-amber-500 hover:bg-amber-700" icon={<MdOutlineLunchDining size={42}/>} />
            <Button label="Salir del Lunch" onClick={marcarSalidaLunch} disabled={openLunch === false || open === false} className="bg-amber-500 hover:bg-amber-700" icon={<MdOutlineLunchDining size={42}/>}/>
            <Button label="Salir del Turno" onClick={marcarSalidaTurno} disabled={open === false || openLunch === true} className="bg-red-500 hover:bg-red-700" icon={<MdOutlinePunchClock size={42}/>} />
          
          </div>
        </div>

        {/* Registros Section */}
        <div className="flex flex-col gap-10 w-full">
           <p className="text-3xl text-black font-bold">Registros de Hoy</p>
           <div className='flex lg:flex-row md:flex-col flex-col gap-6 justify-start items-start'>
              <InfoCard label="Entrada" description={entradaTurno ? entradaTurno.toLocaleString() : 'No marcado'}/>
              <InfoCard label="Lunch In" description={entradaLunch ? entradaLunch.toLocaleString() : 'No marcado'}/>
              <InfoCard label="Lunch Out" description={salidaLunch ? salidaLunch.toLocaleString() : 'No marcado'}/>
              <InfoCard label="Salida" description={salidaTurno ? salidaTurno.toLocaleString() : 'No marcado'}/>
           </div>
        </div>

        <div className='flex items-center justify-center font-bold text-white bg-blue-500 shadow-lg hover:bg-blue-700 p-2 rounded-lg' onClick={handleShowCalendar}>
            Ver Calendario
        </div>

        {displayCalendar && (
          <div className="calendar-space">
            <CalendarDb />
          </div>
        )}


      </div>
    
    </div>
    
  )
}


