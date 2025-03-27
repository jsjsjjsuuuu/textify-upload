
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireApproval?: boolean;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requireApproval = true,
  adminOnly = false
}) => {
  const { user, userProfile, isLoading } = useAuth();

  // للتصحيح المباشر في وحدة التحكم
  useEffect(() => {
    if (user && userProfile) {
      console.log("معلومات المستخدم:", {
        id: user.id,
        email: user.email,
        is_approved: userProfile?.is_approved,
        is_admin: userProfile?.is_admin
      });
    }
  }, [user, userProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log("لا يوجد مستخدم مسجل الدخول، التوجيه إلى:", redirectTo);
    return <Navigate to={redirectTo} />;
  }

  // التحقق من حالة الموافقة إذا كان مطلوبًا
  if (requireApproval && userProfile && !userProfile.is_approved) {
    console.log("المستخدم غير معتمد، التوجيه إلى صفحة تسجيل الدخول");
    return <Navigate to="/login" />;
  }

  // التحقق من صلاحيات المسؤول إذا كان مطلوبًا
  if (adminOnly && userProfile) {
    console.log("التحقق من صلاحيات المسؤول:", userProfile.is_admin);
    if (!userProfile.is_admin) {
      console.log("المستخدم ليس مسؤولاً، التوجيه إلى الصفحة الرئيسية");
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
