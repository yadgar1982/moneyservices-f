import React from 'react'

import AdminLayout from '../Shared/Layouts/AdminLayout'
const brand="Shafaf"
const Dashboard= () => {
  return (
   <AdminLayout>
     <div className='text-lg font-semibold text-zinc-600 mb-4' >Welcome to {brand} Money Service Application</div>
     <div className='md:grid grid-cols-3'>
      <div className='bg-zinc-200 w-full'><h1 className='font-bold text-cyan-700 text-lg md:text-xl'>Deposits</h1>

      </div>
      <div className='bg-zinc-200 w-full'><h1 className='font-bold text-cyan-700 text-lg md:text-xl'>Branches</h1>

      </div>
      <div className='bg-zinc-200 w-full'><h1 className='font-bold text-cyan-700 text-lg md:text-xl'>Currencies</h1>

      </div>

     </div>
     
   </AdminLayout>
  )
}

export default Dashboard