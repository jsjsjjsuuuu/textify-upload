
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
import Bookmarklet from './pages/Bookmarklet';
import ServerAutomation from './pages/ServerAutomation';
import ServerSettings from './pages/ServerSettings';
import ApiSettings from './pages/ApiSettings';
import PolicyPage from './pages/PolicyPage';
import ServicePage from './pages/ServicePage';
import AdminApproval from './pages/AdminApproval';
import AutomationPage from './pages/AutomationPage';
import HomePage from './pages/HomePage';

// مكون الصفحة الرئيسية مع التحقق من حالة تسجيل الدخول
const HomePageWithAuth = () => {
  const { user } = useAuth();
  
  // إذا كان المستخدم قد سجل الدخول، يتم توجيهه إلى صفحة التطبيق
  if (user) {
    return <Navigate to="/app" replace />;
  }
  
  // إذا لم يكن المستخدم مسجلاً، يتم عرض الصفحة الرئيسية
  return <HomePage />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePageWithAuth />,
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
    path: "/bookmarklet",
    element: <ProtectedRoute><Bookmarklet /></ProtectedRoute>,
  },
  {
    path: "/server-automation",
    element: <ProtectedRoute><ServerAutomation /></ProtectedRoute>,
  },
  {
    path: "/server-settings",
    element: <ProtectedRoute><ServerSettings /></ProtectedRoute>,
  },
  {
    path: "/api-settings",
    element: <ProtectedRoute><ApiSettings /></ProtectedRoute>,
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
    path: "/automation",
    element: <ProtectedRoute><AutomationPage /></ProtectedRoute>,
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
