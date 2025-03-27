
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ServicePage from './pages/PolicyPage';
import PolicyPage from './pages/PolicyPage';
import AutomationPage from './pages/AutomationPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Records from './pages/Records';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminApproval from './pages/AdminApproval';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

/**
 * تكوين مسارات التطبيق
 * يمكن استيراد هذا المكون واستخدامه في App.tsx
 */
export const AppRoutes = () => {
  console.log("تحميل المسارات...");
  
  return (
    <AuthProvider>
      <Routes>
        {/* صفحات المصادقة */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* الصفحات المحمية */}
        <Route path="/" element={
          <ProtectedRoute>
            <Records />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* صفحة إدارة المستخدمين - للمسؤولين فقط مع تعطيل requireApproval للمسؤولين */}
        <Route path="/admin/approvals" element={
          <ProtectedRoute adminOnly={true} requireApproval={false} redirectTo="/">
            <AdminApproval />
          </ProtectedRoute>
        } />
        
        <Route path="/records" element={
          <ProtectedRoute>
            <Navigate to="/" replace />
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
