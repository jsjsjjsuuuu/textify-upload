
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
              <div className="flex justify-center items-center h-screen bg-[#0a0f1d] backdrop-blur-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            }>
              <div className="min-h-screen bg-[#0a0f1d] transition-colors duration-300 relative overflow-x-hidden">
                {/* خلفية مع تأثير الطبق */}
                <div className="glass-bg-element opacity-15 blur-3xl rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/20 w-[55rem] h-[55rem] fixed top-[-30rem] right-[-35rem] z-[-1]"></div>
                <div className="glass-bg-element opacity-15 blur-3xl rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 w-[65rem] h-[65rem] fixed bottom-[-35rem] left-[-30rem] z-[-1]"></div>
                
                {/* تأثير دوراني بطيء للأشكال في الخلفية */}
                <div className="fixed inset-0 z-[-2] overflow-hidden">
                  <div className="absolute w-[70rem] h-[70rem] rounded-full bg-gradient-to-br from-blue-600/5 to-purple-600/5 blur-3xl -top-[20rem] -right-[20rem] animate-[spin_120s_linear_infinite]"></div>
                  <div className="absolute w-[80rem] h-[80rem] rounded-full bg-gradient-to-br from-indigo-600/5 to-blue-600/5 blur-3xl -bottom-[30rem] -left-[30rem] animate-[spin_140s_linear_reverse_infinite]"></div>
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
