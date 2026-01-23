import React from 'react'

export default function Historial({ records, username }) {
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