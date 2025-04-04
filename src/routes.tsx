
import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import Records from './pages/Records';
import Profile from './pages/Profile';
import Index from './pages/Index';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PolicyPage from './pages/PolicyPage';
import ServicePage from './pages/ServicePage';
import AdminApproval from './pages/AdminApproval';
import HomePage from './pages/HomePage';

// إنشاء مكون للتحقق من حالة المصادقة وإعادة التوجيه إذا لزم الأمر
const HomeWithAuthCheck = () => {
  const { user } = useAuth();
  
  // إذا كان المستخدم مسجل الدخول، قم بتوجيهه إلى صفحة التطبيق
  if (user) {
    return <Navigate to="/app" replace />;
  }
  
  // وإلا، عرض الصفحة الرئيسية
  return <HomePage />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeWithAuthCheck />,
  },
  {
    path: "/app",
    element: <ProtectedRoute><Index /></ProtectedRoute>,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/records",
    element: <ProtectedRoute><Records /></ProtectedRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/policy",
    element: <PolicyPage />,
  },
  {
    path: "/service",
    element: <ServicePage />,
  },
  {
    path: "/admin/approvals",
    element: <ProtectedRoute><AdminApproval /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

// مكون AppRoutes
export const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default router;
