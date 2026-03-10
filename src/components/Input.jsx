import React from 'react'

function Input({ type, placeholder, value, onChange, required, className }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`border-2 border-gray-300 rounded-lg px-4 py-4 w-full ${className}`}
    />  
  )
}

export default Input