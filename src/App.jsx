import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



import Home from "./components/home";
import Report from "./components/Shared/report/index";
import Homedash from "./components/Shared/dashboard/Home-dash";
import Transactions from "./components/User/transactions";
import Register from "./components/Admin/register";
import Branding from "./components/Admin/branding";
import Currency from "./components/Admin/currency";
import AdminDash from "./components/Shared/dashboard/Admin-dash";
import Branches from "./components/Admin/branches";
import Accounts from "./components/User/account";
import ProtectedLayout from "./components/Shared/Layouts/ProtectedLayout"
import ProtectedAdminLayout from "./components/Shared/Layouts/ProtectedAdminLayout"
import NotFound from "./components/Shared/NotFound";
import Commissions from "./components/User/Comission";
import Backup from "./components/Shared/Backup/Backup.jsx";

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
          {/* Authentication */}
          <Route path="/" element={<Home />} />

          {/*Protected  User Routes */}
          <Route element={<ProtectedLayout/>}>

            <Route path="/user-dash" element={<Homedash />} />
            <Route path="/transaction" element={<Transactions />} />
            <Route path="/report" element={<Report />} />
            <Route path="/account" element={<Accounts />} />
            <Route path="/comissions" element={<Commissions/>}/>
          </Route>

          {/* Protected Admin Route */}
          <Route element={<ProtectedAdminLayout/>}>

          <Route path="/admin-dash" element={<AdminDash />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/register" element={<Register />} />
          <Route path="/branding" element={<Branding />} />
          <Route path="/currency" element={<Currency />} />
          <Route path="/branch" element={<Branches />} />
          </Route>
           <Route path="/404" element={<NotFound />} />
<          Route path="*" element={<NotFound />} />
        </Routes>
       
      </Router>
    </Provider>
  );
};

export default App;
