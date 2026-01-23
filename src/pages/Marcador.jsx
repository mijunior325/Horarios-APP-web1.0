import React, { useState } from 'react'
import Historial from './Historial'

export default function Marcador({ user, onLogout }) {
  const [entradaTurno, setEntradaTurno] = useState(null)
  const [entradaLunch, setEntradaLunch] = useState(null)
  const [salidaLunch, setSalidaLunch] = useState(null)
  const [salidaTurno, setSalidaTurno] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedUser, setSelectedUser] = useState(user)

  const saveRecord = (type, timestamp) => {
    const records = JSON.parse(localStorage.getItem('records')) || {}
    if (!records[user]) records[user] = []
    records[user].push({ type, timestamp: timestamp.toISOString() })
    localStorage.setItem('records', JSON.stringify(records))
  }

  const marcarEntradaTurno = () => {
    const now = new Date()
    setEntradaTurno(now)
    saveRecord('Entrada al Turno', now)
  }
  const marcarEntradaLunch = () => {
    const now = new Date()
    setEntradaLunch(now)
    saveRecord('Entrada al Lunch', now)
  }
  const marcarSalidaLunch = () => {
    const now = new Date()
    setSalidaLunch(now)
    saveRecord('Salida del Lunch', now)
  }
  const marcarSalidaTurno = () => {
    const now = new Date()
    setSalidaTurno(now)
    saveRecord('Salida de Turno', now)
  }

  const getRecords = (username) => {
    const records = JSON.parse(localStorage.getItem('records')) || {}
    return records[username] || []
  }

  const allUsers = () => {
    const users = JSON.parse(localStorage.getItem('users')) || []
    return users.map(u => u.username)
  }

  return (
    <div className="marcador">
      <h1>Marcador de Tiempo de Trabajo</h1>
      <p>Bienvenido, {user}</p>
      <button onClick={onLogout} className="logout">Cerrar Sesión</button>
      <div className="botones">
        <button onClick={marcarEntradaTurno} disabled={entradaTurno !== null}>
          Entrada al Turno
        </button>
        <button onClick={marcarEntradaLunch} disabled={entradaLunch !== null || entradaTurno === null}>
          Entrada al Lunch
        </button>
        <button onClick={marcarSalidaLunch} disabled={salidaLunch !== null || entradaLunch === null}>
          Salida del Lunch
        </button>
        <button onClick={marcarSalidaTurno} disabled={salidaTurno !== null || salidaLunch === null}>
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
          {user === 'admin' ? (
            <div>
              <h3>Seleccionar Usuario</h3>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                {allUsers().map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <Historial records={getRecords(selectedUser)} username={selectedUser} />
            </div>
          ) : (
            <Historial records={getRecords(user)} username={user} />
          )}
        </div>
      )}
    </div>
  )
}