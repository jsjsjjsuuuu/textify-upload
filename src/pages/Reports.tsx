
import React from 'react';
import AppHeader from '@/components/AppHeader';

const Reports: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppHeader />
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">التقارير</h1>
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-center">
            <p className="text-gray-400">قريباً - سيتم إضافة التقارير والإحصائيات في التحديث القادم</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
