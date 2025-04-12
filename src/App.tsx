
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
              <div className="flex justify-center items-center h-screen bg-[#0d1123] backdrop-blur-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            }>
              <div className="min-h-screen bg-[#0d1123] transition-colors duration-300">
                <div className="glass-bg-element opacity-10 blur-3xl rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/20 w-[40rem] h-[40rem] fixed top-[-20rem] right-[-20rem] z-[-1]"></div>
                <div className="glass-bg-element opacity-10 blur-3xl rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 w-[50rem] h-[50rem] fixed bottom-[-25rem] left-[-20rem] z-[-1]"></div>
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
