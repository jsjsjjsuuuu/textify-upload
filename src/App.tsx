
import React, { Suspense } from 'react';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
              <AppRoutes />
            </Suspense>
            <Toaster />
            <SonnerToaster position="top-center" closeButton />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
