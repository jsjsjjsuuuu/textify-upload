
import React from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">حسابي</h1>
          <p className="text-muted-foreground mb-6">صفحة إدارة الحساب</p>
          
          <Button onClick={() => navigate('/profile')}>
            تعديل الملف الشخصي
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Account;
