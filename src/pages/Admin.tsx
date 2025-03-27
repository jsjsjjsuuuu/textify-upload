
import React from 'react';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">لوحة التحكم الإدارية</h1>
          <p className="text-muted-foreground mb-6">صفحة إدارة النظام</p>
          
          <Button onClick={() => navigate('/admin/approvals')}>
            الموافقات
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
