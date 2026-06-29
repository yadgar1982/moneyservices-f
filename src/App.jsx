import React from 'react'
import { Route,Routes,BrowserRouter as Router } from 'react-router-dom'
import {Provider} from "react-redux";
import { store } from './redux/store';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import Home from './components/home'
import Report from './components/User/Report'
import Login from './components/Shared/Login'
import Homedash from './components/User/Home-dash'
import Transactions from './components/User/transactions'
import Register from './components/Admin/register'
import Branding from './components/Admin/branding'
import Currency from './components/Admin/currency'
import AdminDash from './components/Admin/Admin-dash'
import Branches from './components/Admin/branches';
import Accounts from './components/User/account';

const App = () => {
  return (
    <Provider store={store}>
      <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      <Router>
        <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/user-dash' element={<Homedash/>}/>
        <Route path='/transaction' element={<Transactions/>}/>
        <Route path='/report' element={<Report/>}/>
       
        <Route path='/account' element={<Accounts/>}/>
        
        
        {/* Admin Routers */}
        <Route path='/register' element={<Register/>}/>
        <Route path='/admin-dash' element={<AdminDash/>}/>
         <Route path='/branding' element={<Branding/>}/>
        <Route path='/currency' element={<Currency/>}/>
        <Route path='/branch' element={<Branches/>}/>
      </Routes>
      </Router>
    </Provider>
  
  )
}

export default App