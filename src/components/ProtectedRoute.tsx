
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requireApproval = true
}) => {
  const { user, userProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  // التحقق من حالة الموافقة إذا كان مطلوبًا
  if (requireApproval && userProfile) {
    // استخدام is_approved بشكل أساسي، مع الرجوع إلى isApproved كاحتياطي
    const isUserApproved = userProfile.is_approved !== null ? userProfile.is_approved : userProfile.isApproved;
    
    if (!isUserApproved) {
      return <Navigate to="/login" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
