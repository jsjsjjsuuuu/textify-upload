
import React from 'react';
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
        <SonnerToaster position="top-center" closeButton />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
