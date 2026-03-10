import React from 'react'

function InfoCard({label, description}) {
  return (
    <div className='flex flex-col items-start text-black p-8 bg-gray-200 rounded-lg w-1/4 sm:h-30 lg:h-50 md:w-full sm:w-full shadow-lg border border-gray-300'>
        <p className= "font-bold text-3xl">{label}</p>
        <p className="text-lg">{description}</p>
    </div>
  )
}

export default InfoCard