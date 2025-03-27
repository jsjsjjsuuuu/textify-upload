import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import Account from '@/pages/Account';
import Admin from '@/pages/Admin';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Home />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </AuthProvider>
      </Router>
      
      <Toaster richColors position="top-center" dir="rtl" />
    </>
  );
}

export default App;
