
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="glass-morphism min-h-screen flex items-center justify-center p-8">
      <div className="neo-blur p-8 max-w-md w-full rounded-2xl">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gradient">404</h1>
          <h2 className="text-2xl font-semibold text-white/90">الصفحة غير موجودة</h2>
          <p className="text-lg text-white/70 mb-8">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم حذفها.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600/70 backdrop-blur-md border border-indigo-500/30 hover:bg-indigo-600 transition-all text-white"
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
