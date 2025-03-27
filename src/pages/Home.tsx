
import React from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">مرحبًا بك في الصفحة الرئيسية</h1>
          <p className="text-muted-foreground mb-6">هذه هي الصفحة الرئيسية للتطبيق</p>
          
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/records')}>
              عرض السجلات
            </Button>
            <Button variant="outline" onClick={() => navigate('/profile')}>
              الملف الشخصي
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
