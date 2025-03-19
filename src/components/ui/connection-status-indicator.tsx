
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { checkConnection, getLastConnectionStatus, isConnected } from "@/utils/automationServerUrl";
import { cn } from "@/lib/utils";

interface ConnectionStatusIndicatorProps {
  showText?: boolean;
  className?: string;
  onStatusChange?: (status: boolean) => void;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  showText = true,
  className,
  onStatusChange
}) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isChecking, setIsChecking] = useState(false);
  const [statusDetail, setStatusDetail] = useState("");
  
  const checkServerStatus = async () => {
    setIsChecking(true);
    setStatus('checking');
    
    try {
      const connectionResult = await checkConnection();
      
      if (connectionResult.isConnected) {
        setStatus('connected');
        setStatusDetail("متصل بالخادم");
        onStatusChange?.(true);
      } else {
        setStatus('disconnected');
        setStatusDetail(connectionResult.message);
        onStatusChange?.(false);
      }
    } catch (error) {
      setStatus('disconnected');
      setStatusDetail(error instanceof Error ? error.message : "خطأ غير معروف");
      onStatusChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  // فحص الحالة عند تحميل المكون
  useEffect(() => {
    // نحصل أولاً على الحالة المخزنة
    const storedStatus = getLastConnectionStatus();
    
    if (storedStatus.isConnected) {
      setStatus('connected');
      setStatusDetail("متصل بالخادم");
      onStatusChange?.(true);
    } else {
      setStatus('disconnected');
      setStatusDetail("غير متصل بالخادم");
      onStatusChange?.(false);
    }
    
    // ثم نقوم بالفحص لتحديث الحالة
    checkServerStatus();
    
    // فحص دوري كل 60 ثانية
    const intervalId = setInterval(checkServerStatus, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [onStatusChange]);
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {status === 'checking' || isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
              ) : status === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              
              {showText && (
                <span 
                  className={cn(
                    "text-sm",
                    status === 'connected' && "text-green-600",
                    status === 'disconnected' && "text-red-600",
                    status === 'checking' && "text-yellow-600"
                  )}
                >
                  {status === 'checking' ? 'جاري الفحص...' : 
                   status === 'connected' ? 'متصل' : 'غير متصل'}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{statusDetail}</p>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs underline"
              onClick={checkServerStatus} 
              disabled={isChecking}
            >
              إعادة الفحص
            </Button>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ConnectionStatusIndicator;
