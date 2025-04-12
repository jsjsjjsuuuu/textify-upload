
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center p-8">
      <div className="p-8 max-w-md w-full rounded-2xl bg-[#0e1529]/95">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gradient">404</h1>
          <h2 className="text-2xl font-semibold text-white/90">الصفحة غير موجودة</h2>
          <p className="text-lg text-white/70 mb-8">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم حذفها.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
