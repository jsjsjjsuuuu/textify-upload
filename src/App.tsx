
import React, { Suspense, useEffect } from 'react';
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import ResetProcessingButton from '@/components/ResetProcessingButton';

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
  
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <AuthProvider>
          <TooltipProvider>
            <Suspense fallback={
              <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
              <AppRoutes />
            </Suspense>
            <Toaster />
            <SonnerToaster position="top-center" closeButton />
            <ResetProcessingButton />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
