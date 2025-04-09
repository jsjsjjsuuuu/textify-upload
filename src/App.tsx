
import React, { Suspense } from 'react';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/auth";
import ConnectionErrorHandler from "@/components/Connection/ConnectionErrorHandler";

// مكون منفصل للمحتوى داخل AuthProvider
function AppContent() {
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
            <AppRoutes />
            <Toaster />
            <SonnerToaster position="top-center" closeButton />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
