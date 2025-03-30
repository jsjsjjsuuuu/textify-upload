
import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider, Route, Routes } from 'react-router-dom';
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
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
    path: "/admin-approval",
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

// إضافة مكون AppRoutes لاستخدامه في App.tsx
export const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default router;
