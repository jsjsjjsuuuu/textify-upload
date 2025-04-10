import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Reports from './pages/Reports';
import Records from './pages/Records';
import Settings from './pages/Settings';
import { Toaster } from "@/components/ui/toaster"
import ReceiptImageView from "@/pages/ReceiptyImageView";
import ReceiptGallery from "@/pages/ReceiptGallery";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/records" element={<Records />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/receipt/:id" element={<ReceiptImageView />} />
            <Route path="/receipts" element={<ReceiptGallery />} />
          </Routes>
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
