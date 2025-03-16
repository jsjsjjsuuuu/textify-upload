
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import ApiSettings from './pages/ApiSettings';
import Bookmarklet from './pages/Bookmarklet';
import Records from './pages/Records';
import NotFound from './pages/NotFound';
import ServerSettings from './pages/ServerSettings';

/**
 * تكوين مسارات التطبيق
 * يمكن استيراد هذا المكون واستخدامه في App.tsx
 */
export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/settings" element={<ApiSettings />} />
      <Route path="/server-settings" element={<ServerSettings />} />
      <Route path="/bookmarklet" element={<Bookmarklet />} />
      <Route path="/records" element={<Records />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
