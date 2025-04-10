
import React from 'react';
import AppHeader from '@/components/AppHeader';
import DashboardContent from '@/components/Dashboard/DashboardContent';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppHeader />
      <DashboardContent />
    </div>
  );
};

export default Dashboard;
