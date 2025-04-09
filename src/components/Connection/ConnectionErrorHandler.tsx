
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ImageErrorDisplay from "@/components/ImagePreview/ImageViewer/ImageErrorDisplay";
import { useAuth } from '@/contexts/auth/AuthContext';

interface ConnectionErrorHandlerProps {
  className?: string;
}

/**
 * مكون لعرض أخطاء الاتصال وحالة عدم الاتصال بالإنترنت
 */
const ConnectionErrorHandler: React.FC<ConnectionErrorHandlerProps> = ({ className = "" }) => {
  const { isLoading, isOffline, connectionError, retryConnection } = useAuth();
  
  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-screen bg-background ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isOffline || connectionError) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
        <ImageErrorDisplay 
          title={isOffline ? "لا يوجد اتصال بالإنترنت" : "خطأ في الاتصال بالخادم"}
          message={connectionError || "يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."}
          onRetry={retryConnection}
          className="max-w-xl p-8"
          icon={isOffline ? <WifiOff className="w-10 h-10 text-red-500" /> : undefined}
        />
      </div>
    );
  }
  
  return null;
};

export default ConnectionErrorHandler;
