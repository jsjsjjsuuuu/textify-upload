
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
  try {
    return <RouterProvider router={router} />;
  } catch (error) {
    console.error("خطأ في توجيه التطبيق:", error);
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500 mb-4">خطأ في تحميل التطبيق</h1>
        <p className="text-gray-600">يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => window.location.reload()}
        >
          تحديث الصفحة
        </button>
      </div>
    );
  }
};

export default router;
