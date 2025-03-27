
import React from 'react';
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
  if (requireApproval && userProfile && !userProfile.is_approved) {
    return <Navigate to="/login" />;
  }

  // التحقق من صلاحيات المسؤول إذا كان مطلوبًا
  if (adminOnly && userProfile && !userProfile.is_admin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
