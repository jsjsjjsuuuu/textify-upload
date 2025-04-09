
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/auth/AuthContext';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showRetryButton?: boolean;
}

/**
 * مؤشر حالة الاتصال المستخدم في واجهة المستخدم
 */
const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
  className = "", 
  showRetryButton = true 
}) => {
  const { isOffline, connectionError, retryConnection } = useAuth();
  
  if (!isOffline && !connectionError) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isOffline ? (
        <div className="flex items-center gap-1 text-red-500">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">غير متصل</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-amber-500">
          <Wifi className="w-4 h-4" />
          <span className="text-sm">اتصال ضعيف</span>
        </div>
      )}
      
      {showRetryButton && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-xs" 
          onClick={() => retryConnection()}
        >
          إعادة الاتصال
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
