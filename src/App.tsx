
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";

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
      <ThemeProvider defaultTheme="dark" storageKey="app-theme">
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="flex justify-center items-center h-screen app-background backdrop-blur-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            }>
              <div className="app-background">
                {/* تأثيرات خلفية موحدة للتطبيق */}
                <div className="fixed inset-0 -z-10">
                  <div className="absolute -top-40 -right-40 w-[50rem] h-[50rem] rounded-full opacity-10 blur-3xl bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/5"></div>
                  <div className="absolute -bottom-40 -left-40 w-[50rem] h-[50rem] rounded-full opacity-10 blur-3xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/5"></div>
                </div>
                <AppRoutes />
              </div>
            </Suspense>
            <Toaster />
            <SonnerToaster position="top-center" closeButton theme="dark" />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
