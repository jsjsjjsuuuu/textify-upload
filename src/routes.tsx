
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Records from './pages/Records';
import ServerSettings from './pages/ServerSettings';
import ServerAutomation from './pages/ServerAutomation';
import NotFound from './pages/NotFound';

/**
 * تكوين مسارات التطبيق
 * يمكن استيراد هذا المكون واستخدامه في App.tsx
 */
export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/server-automation" element={<ServerAutomation />} />
      <Route path="/server-settings" element={<ServerSettings />} />
      <Route path="/records" element={<Records />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
