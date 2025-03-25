
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ServicePage from './pages/ServicePage';
import PolicyPage from './pages/PolicyPage';
import AutomationPage from './pages/AutomationPage';

/**
 * تكوين مسارات التطبيق
 * يمكن استيراد هذا المكون واستخدامه في App.tsx
 */
export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/services" element={<ServicePage />} />
      <Route path="/policy" element={<PolicyPage />} />
      <Route path="/automation/:imageId" element={<AutomationPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
