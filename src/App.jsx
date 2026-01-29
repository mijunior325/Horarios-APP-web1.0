import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import './App.css'
import Calendar from './components/Calendar'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    fetch('/users.xlsx')
      .then(response => {
        console.log('Response status:', response.status)
        if (!response.ok) throw new Error('Archivo no encontrado')
        return response.arrayBuffer()
      })
      .then(data => {
        console.log('Data loaded:', data)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        console.log('Sheet name:', sheetName)
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        console.log('JSON data:', json)
        const users = json.map(row => {
          console.log('Row:', row)
          return {
            username: (row.username || row.Username || row.usuario || row.Usuario || row.User || '').trim(),
            password: (row.password || row.Password || row.contraseña || row.Contraseña || row.Password || '').trim()
          }
        }).filter(u => u.username && u.password)
        console.log('Parsed users:', users)
        if (users.length > 0) {
          localStorage.setItem('users', JSON.stringify(users))
          console.log('Users saved to localStorage')
        } else {
          localStorage.setItem('users', JSON.stringify([{ username: 'admin', password: 'admin' }]))
          console.log('No valid users, using admin')
        }
      })
      .catch(error => {
        console.log('Error loading Excel:', error)
        // Si no hay archivo, usar admin
        const users = JSON.parse(localStorage.getItem('users')) || []
        if (users.length === 0) {
          users.push({ username: 'admin', password: 'admin' })
          localStorage.setItem('users', JSON.stringify(users))
        }
      })
  }, [])

  const handleLogin = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || []
    console.log('Stored users:', users)
    console.log('Attempting login with:', username, password)
    const user = users.find(u => u.username === username && u.password === password)
    console.log('Found user:', user)
    if (user) {
      setIsLoggedIn(true)
      setCurrentUser(username)
      setLoginError('')
    } else {
      setLoginError('Usuario o contraseña incorrectos')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser('')
  }

  if (isLoggedIn) {
    return <Marcador user={currentUser} onLogout={handleLogout} />
  }

  return (
    <div className="app">
      <h1>Marcador de Tiempo de Trabajo</h1>
      <LoginForm onLogin={handleLogin} error={loginError} />
    </div>
  )
}

function LoginForm({ onLogin, error }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(username, password)
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Iniciar Sesión</h2>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Iniciar Sesión</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}



function Marcador({ user, onLogout }) {
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

              <div style={{ marginTop: 20 }}>
                <h3>Filtro avanzado</h3>
                <Calendar />
              </div>
            </div>
          ) : (
            <Historial records={getRecords(user)} username={user} />
          )}
        </div>
      )}
    </div>
  )
}



function Historial({ records, username }) {
  return (
    <div>
      <h3>Historial de {username}</h3>
      {records.length === 0 ? (
        <p>No hay registros.</p>
      ) : (
        <ul>
          {records.map((record, index) => (
            <li key={index}>
              {record.type}: {new Date(record.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
