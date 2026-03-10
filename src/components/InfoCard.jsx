import React from 'react'

function InfoCard({label, description}) {
  return (
    <div className='flex flex-col items-start text-black p-8 bg-gray-200 rounded-lg lg:w-1/4 gap-2 w-full shadow-lg border border-gray-300'>
        <p className= "font-bold text-3xl">{label}</p>
        <p className="text-lg">{description}</p>
    </div>
  )
}

export default InfoCard