
import React from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

const Onboarding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppHeader />
      <div className="container mx-auto py-12">
        <div className="max-w-3xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">مرحباً بك في نظام إدارة الوصولات</h1>
          
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-md">
              <h2 className="text-xl font-medium mb-2">1. تحميل الوصولات</h2>
              <p className="text-gray-300">
                يمكنك تحميل صور الوصولات بكل سهولة من خلال لوحة التحكم. النظام سيقوم باستخراج البيانات تلقائياً.
              </p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <h2 className="text-xl font-medium mb-2">2. استعراض ومراجعة البيانات</h2>
              <p className="text-gray-300">
                راجع البيانات المستخرجة وقم بتعديلها إذا لزم الأمر قبل حفظها في النظام.
              </p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <h2 className="text-xl font-medium mb-2">3. تصدير وإدارة السجلات</h2>
              <p className="text-gray-300">
                يمكنك تصدير البيانات واستعراض التقارير والإحصائيات بسهولة.
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button asChild className="bg-purple-700 hover:bg-purple-800">
              <Link to="/dashboard">
                انتقل إلى لوحة التحكم
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
