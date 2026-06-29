import React from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col'>

      {/* Navbar */}
      <div className='flex justify-between items-center px-8 py-4 bg-white shadow-sm'>
        <h1 className='text-2xl font-bold text-green-600'>YadgarPay</h1>
        <div className='space-x-4'>
          <Button onClick={() => navigate('/login')}>Login</Button>
          <Button type='primary' onClick={() => navigate('/register')}>
            Sign Up
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className='flex flex-1 items-center justify-center px-6'>
        <div className='max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center'>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-4xl md:text-5xl font-bold mb-4'>
              Send Money Worldwide 🌍
            </h2>
            <p className='text-gray-600 text-lg mb-6'>
              Fast, secure and simple money transfers. Built for global users and businesses.
            </p>

            <div className='space-x-4'>
              <Button
                type='primary'
                size='large'
                className='bg-green-600'
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>

              <Button
                size='large'
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </div>
          </motion.div>

          {/* Right UI Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className='bg-white rounded-2xl shadow-xl p-6'
          >
            <h3 className='text-xl font-semibold mb-4'>Quick Actions</h3>

            <div className='space-y-4'>
              <Button block size='large' onClick={() => navigate('/send')}>
                Send Money
              </Button>

              <Button block size='large' onClick={() => navigate('/receive')}>
                Receive Money
              </Button>

              <Button block size='large' onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Footer */}
      <div className='text-center py-4 text-gray-400 text-sm'>
        © 2026 YadgarPay — Secure Payments Worldwide
      </div>
    </div>
  )
}

export default Home
