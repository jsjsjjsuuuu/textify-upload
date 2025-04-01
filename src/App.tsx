
import React, { Suspense, useEffect } from 'react';
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

function App() {
  console.log("تحميل التطبيق الرئيسي App");
  
  // تسجيل نوع المتصفح ومعلومات أخرى يمكن أن تساعد في التصحيح
  useEffect(() => {
    console.log("معلومات المتصفح:", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    });
  }, []);
  
  // مكون لمراقبة التوجيه بناءً على حالة تسجيل الدخول
  const AuthRedirect = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
      // إذا كان المستخدم قد سجل الدخول وكان على الصفحة الرئيسية، يتم توجيهه إلى صفحة التطبيق
      if (user && location.pathname === '/') {
        navigate('/app');
      }
    }, [user, location.pathname, navigate]);
    
    return null;
  };
  
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <AuthProvider>
          <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            <AuthRedirect />
            <AppRoutes />
          </Suspense>
          <Toaster />
          <SonnerToaster position="top-center" closeButton />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

// استيراد useAuth من السياق
import { useAuth } from "@/contexts/AuthContext";

export default App;
