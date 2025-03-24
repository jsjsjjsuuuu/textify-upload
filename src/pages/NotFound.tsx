
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">404 - الصفحة غير موجودة</h1>
      <p className="mb-4">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
      <Link to="/" className="text-blue-500 hover:underline">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
};

export default NotFound;
