
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen app-background flex items-center justify-center p-8">
      <div className="dish-container max-w-md w-full">
        <div className="dish-glow-top"></div>
        <div className="dish-glow-bottom"></div>
        <div className="dish-reflection"></div>
        <div className="dish-inner-shadow"></div>
        <div className="relative z-10 p-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-gradient">404</h1>
            <h2 className="text-2xl font-semibold text-white/90">الصفحة غير موجودة</h2>
            <p className="text-lg text-white/70 mb-8">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم حذفها.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl theme-button-primary"
            >
              <ArrowLeft className="h-5 w-5" />
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
