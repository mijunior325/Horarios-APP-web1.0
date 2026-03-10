import React from 'react'

function Button({ onClick, className, label, disabled, icon }) {
  const baseClass = "text-xl font-bold w-1/4 gap-2 h-50 shadow-lg border border-gray-300 rounded-lg flex justify-center items-center transition-colors duration-200";
  const enabledClass = "text-white cursor-pointer";
  const disabledClass = "bg-gray-400 text-gray-200 cursor-not-allowed hover:bg-gray-400";
  // Remove color classes from className if disabled
  const filteredClassName = disabled
    ? className?.replace(/bg-(green|amber|red)-500|hover:bg-(green|amber|red)-700/g, "")
    : className;
  return (
    <div
      className={`${baseClass} ${disabled ? disabledClass : enabledClass} ${filteredClassName}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      style={disabled ? { pointerEvents: 'none' } : {}}
    >
      {icon}
      {label}
    </div>
  );
}

export default Button