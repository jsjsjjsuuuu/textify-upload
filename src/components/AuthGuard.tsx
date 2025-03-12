
import { ReactNode, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const AuthGuard = ({ children, requireAdmin = false }: AuthGuardProps) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (requireAdmin && !isAdmin) {
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate, requireAdmin]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  // إضافة تسجيل للتأكد من تشغيل الحارس
  console.log("AuthGuard فعال:", { 
    isAuthenticated, 
    isAdmin, 
    userRole: user?.role,
    requireAdmin
  });

  return <>{children}</>;
};

export default AuthGuard;
