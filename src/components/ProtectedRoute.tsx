
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

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
  const location = useLocation();
  console.log("تحميل مكون الحماية ProtectedRoute", {
    adminOnly,
    requireApproval,
    location: location.pathname
  });
  
  const { user, userProfile, isLoading, refreshUserProfile, isOffline, connectionError } = useAuth();

  // عند تحميل المكون، قم بتحديث الملف الشخصي للتأكد من أحدث البيانات
  useEffect(() => {
    if (user && !isLoading && !isOffline && !connectionError) {
      console.log("محاولة تحديث ملف المستخدم في ProtectedRoute");
      try {
        refreshUserProfile();
      } catch (error) {
        console.error("خطأ في تحديث ملف المستخدم:", error);
      }
    }
  }, [user, refreshUserProfile, isLoading, isOffline, connectionError]);

  // للتصحيح المباشر في وحدة التحكم
  useEffect(() => {
    if (user && userProfile) {
      console.log("معلومات المستخدم في ProtectedRoute:", {
        id: user.id,
        email: user.email,
        is_approved: userProfile?.is_approved,
        is_admin: userProfile?.is_admin,
        adminOnly: adminOnly,
        requireApproval: requireApproval,
        is_admin_type: typeof userProfile?.is_admin,
        location: location.pathname
      });
    }
  }, [user, userProfile, adminOnly, requireApproval, location.pathname]);

  // إذا كان هناك مشكلة في الاتصال، نسمح للمستخدم بالمتابعة إلى ConnectionErrorHandler
  if (isOffline || connectionError) {
    return <>{children}</>;
  }
  
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
    // تأخير عرض التوست حتى بعد الانتقال
    setTimeout(() => {
      toast.error("يجب تسجيل الدخول للوصول إلى هذه الصفحة");
    }, 100);
    return <Navigate to={redirectTo} state={{ from: location.pathname }} />;
  }

  // التحقق من حالة الموافقة إذا كان مطلوبًا
  if (requireApproval && userProfile && !userProfile.is_approved) {
    console.log("المستخدم غير معتمد، التوجيه إلى صفحة تسجيل الدخول");
    setTimeout(() => {
      toast.warning("حسابك قيد المراجعة. يرجى الانتظار حتى تتم الموافقة عليه.");
    }, 100);
    return <Navigate to="/login" state={{ message: "حسابك قيد المراجعة. يرجى الانتظار حتى تتم الموافقة عليه." }} />;
  }

  // التحقق من صلاحيات المسؤول إذا كان مطلوبًا
  if (adminOnly && userProfile) {
    console.log("التحقق من صلاحيات المسؤول:", userProfile.is_admin);
    // تأكد من أن المقارنة تتم مع قيمة منطقية
    const isAdmin = userProfile.is_admin === true;
    if (!isAdmin) {
      console.log("المستخدم ليس مسؤولاً، التوجيه إلى الصفحة الرئيسية");
      setTimeout(() => {
        toast.error("ليس لديك صلاحيات الوصول إلى هذه الصفحة");
      }, 100);
      return <Navigate to="/" />;
    } else {
      console.log("المستخدم مسؤول، السماح بالوصول إلى صفحة الإدارة");
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
