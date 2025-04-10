
import React from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      <AppHeader />
      <div className="container mx-auto py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-6">مرحباً بك في نظام إدارة الوصولات</h1>
          <p className="text-xl text-gray-300 mb-8">
            منصة متكاملة لإدارة وأرشفة وتتبع وصولاتك بكل سهولة
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-purple-700 hover:bg-purple-800 text-lg px-8 py-6">
              <Link to="/dashboard">
                لوحة التحكم
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="text-lg px-8 py-6">
              <Link to="/receipts">
                استعراض الوصولات
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
