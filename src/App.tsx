
import React, { Suspense, useEffect, useState } from 'react';
import { AppRoutes } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import ResetProcessingButton from '@/components/ResetProcessingButton';
import { toast } from "sonner";

function App() {
  console.log("تحميل التطبيق الرئيسي App");
  const [showGeminiWarning, setShowGeminiWarning] = useState(false);
  const [processingImproved, setProcessingImproved] = useState(false);
  
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
    
    // فحص ما إذا كان هناك أخطاء سابقة في استخراج البيانات
    const hasProcessingErrors = localStorage.getItem('gemini_processing_errors');
    if (hasProcessingErrors) {
      setShowGeminiWarning(true);
      
      // تعيين علامة بأن المعالجة تم تحسينها
      localStorage.setItem('processing_improved', 'true');
      setProcessingImproved(true);
      
      // عرض إشعار للمستخدم
      setTimeout(() => {
        toast.info(
          "تم تحسين نظام استخراج البيانات",
          {
            description: "تم تحسين نظام استخراج البيانات، يرجى محاولة رفع الصور مرة أخرى.",
            duration: 8000,
          }
        );
      }, 2000);
      
      // مسح سجل الأخطاء
      localStorage.removeItem('gemini_processing_errors');
    } else {
      // التحقق مما إذا كان التحسين قد تم مسبقاً
      const isImproved = localStorage.getItem('processing_improved');
      if (isImproved === 'true') {
        setProcessingImproved(true);
      }
    }
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
            
            {/* إشعار لتنبيه المستخدم بتحسين نظام استخراج البيانات إذا كان هناك أخطاء سابقة */}
            {showGeminiWarning && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-100 text-blue-800 px-4 py-2 rounded-md shadow-md text-center">
                تم تحسين نظام استخراج البيانات. يرجى إعادة رفع الصور للحصول على أفضل النتائج.
              </div>
            )}
            
            {/* إشعار لتأكيد تحسين المعالجة */}
            {processingImproved && !showGeminiWarning && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 text-green-800 px-4 py-2 rounded-md shadow-md text-center">
                نظام استخراج البيانات المحسن قيد التشغيل
              </div>
            )}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
