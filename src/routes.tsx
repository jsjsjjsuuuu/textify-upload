
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ServicePage from './pages/ServicePage';
import PolicyPage from './pages/PolicyPage';
import AutomationPage from './pages/AutomationPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Records from './pages/Records';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

/**
 * تكوين مسارات التطبيق
 * يمكن استيراد هذا المكون واستخدامه في App.tsx
 */
export const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* صفحات المصادقة */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* الصفحات المحمية */}
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute>
            <Records />
          </ProtectedRoute>
        } />
        <Route path="/automation/:imageId" element={
          <ProtectedRoute>
            <AutomationPage />
          </ProtectedRoute>
        } />
        
        {/* الصفحات العامة */}
        <Route path="/services" element={<ServicePage />} />
        <Route path="/policy" element={<PolicyPage />} />
        
        {/* صفحة 404 والتحويلات */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};
