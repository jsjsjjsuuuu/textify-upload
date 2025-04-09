
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import { useAuth } from "@/contexts/auth/AuthContext";
import ConnectionErrorHandler from "@/components/Connection/ConnectionErrorHandler";
import { Wifi, WifiOff } from "lucide-react";

// مكون التطبيق الأساسي مع وضع خدمة مراقبة الاتصال
function AppContent() {
  const { isLoading, isOffline, connectionError } = useAuth();
  
  console.log("حالة التطبيق:", {
    isLoading, 
    isOffline, 
    hasConnectionError: !!connectionError
  });
  
  // تسجيل نوع المتصفح ومعلومات أخرى يمكن أن تساعد في التصحيح
  useEffect(() => {
    console.log("معلومات المتصفح:", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      online: navigator.onLine
    });
  }, []);
  
  // إذا كان هناك مشكلة في الاتصال، نعرض صفحة الخطأ
  if (isLoading || isOffline || connectionError) {
    return <ConnectionErrorHandler />;
  }
  
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <AppRoutes />
      </div>
    </Suspense>
  );
}

function App() {
  console.log("تحميل التطبيق الرئيسي App");
  
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
            <Toaster />
            <SonnerToaster position="top-center" closeButton />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
