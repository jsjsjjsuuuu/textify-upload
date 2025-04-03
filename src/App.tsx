
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import SupabaseStorageCheck from "@/components/SupabaseStorageCheck";
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  useEffect(() => {
    // يمكن إضافة منطق التهيئة هنا إذا لزم الأمر
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <SupabaseStorageCheck />
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
