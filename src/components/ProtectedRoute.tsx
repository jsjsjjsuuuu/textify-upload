
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
  console.log("تحميل مكون الحماية ProtectedRoute");
  const { user, userProfile, isLoading, refreshUserProfile } = useAuth();

  // عند تحميل المكون، قم بتحديث الملف الشخصي للتأكد من أحدث البيانات
  useEffect(() => {
    if (user) {
      console.log("محاولة تحديث ملف المستخدم في ProtectedRoute");
      refreshUserProfile();
    }
  }, [user, refreshUserProfile]);

  // للتصحيح المباشر في وحدة التحكم
  useEffect(() => {
    if (user && userProfile) {
      console.log("معلومات المستخدم في ProtectedRoute:", {
        id: user.id,
        email: user.email,
        is_approved: userProfile?.is_approved,
        is_admin: userProfile?.is_admin,
        adminOnly: adminOnly,
        requireApproval: requireApproval
      });
    }
  }, [user, userProfile, adminOnly, requireApproval]);

  if (isLoading) {
    console.log("جاري تحميل بيانات المستخدم في ProtectedRoute");
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجلاً، قم بتوجيهه إلى صفحة تسجيل الدخول
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
    if (userProfile.is_admin !== true) {
      console.log("المستخدم ليس مسؤولاً، التوجيه إلى الصفحة الرئيسية");
      return <Navigate to="/" />;
    } else {
      console.log("المستخدم مسؤول، السماح بالوصول إلى صفحة الإدارة");
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
