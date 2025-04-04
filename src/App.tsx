
import React, { Suspense, useEffect } from 'react';
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  console.log("تحميل التطبيق الرئيسي App");
  
  // تسجيل نوع المتصفح ومعلومات أخرى يمكن أن تساعد في التصحيح
  useEffect(() => {
    try {
      console.log("معلومات المتصفح:", {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      });
    } catch (error) {
      console.error("خطأ في تسجيل معلومات المتصفح:", error);
    }
  }, []);
  
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <AuthProvider>
          <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            <AppRoutes />
          </Suspense>
          <Toaster />
          <SonnerToaster position="top-center" closeButton />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
