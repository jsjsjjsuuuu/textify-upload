
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { checkConnection, getLastConnectionStatus } from "@/utils/automationServerUrl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const checkServerStatus = async () => {
    if (isChecking) return; // تجنب تكرار الفحص إذا كان هناك فحص قيد التقدم
    
    setIsChecking(true);
    setStatus('checking');
    
    try {
      const connectionResult = await checkConnection();
      
      if (connectionResult.isConnected) {
        setStatus('connected');
        setStatusDetail("متصل بخادم Render");
        setRetryAttempt(0);
        onStatusChange?.(true);
      } else {
        setStatus('disconnected');
        setStatusDetail(connectionResult.message || "جاري محاولة الاتصال بخادم Render...");
        onStatusChange?.(false);
        
        // زيادة عدد المحاولات
        setRetryAttempt(prev => prev + 1);
        
        // إذا كان هناك عدة محاولات فاشلة، عرض رسالة للمستخدم
        if (retryAttempt >= 3 && retryAttempt % 5 === 0) {
          toast.error(
            `تعذر الاتصال بخادم Render بعد ${retryAttempt} محاولة. تأكد من أن الخادم يعمل.`,
            { duration: 10000 }
          );
        }
        
        // محاولة إعادة الاتصال تلقائيًا - استخدام فترة انتظار متزايدة
        const retryDelay = Math.min(5000 + (retryAttempt * 1000), 15000);
        setTimeout(checkServerStatus, retryDelay);
      }
    } catch (error) {
      setStatus('disconnected');
      const errorMsg = error instanceof Error ? error.message : "جاري محاولة الاتصال بخادم Render...";
      
      // إضافة تفاصيل إضافية للمستخدم
      let detailedError = errorMsg;
      if (errorMsg.includes("Failed to fetch")) {
        detailedError = "تعذر الوصول إلى خادم Render - قد يكون الخادم غير متاح أو هناك مشكلة في الشبكة";
      }
      
      setStatusDetail(detailedError);
      onStatusChange?.(false);
      
      // زيادة عدد المحاولات
      setRetryAttempt(prev => prev + 1);
      
      // محاولة إعادة الاتصال تلقائيًا
      const retryDelay = Math.min(5000 + (retryAttempt * 1000), 15000);
      setTimeout(checkServerStatus, retryDelay);
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
      setStatusDetail("متصل بخادم Render");
      onStatusChange?.(true);
    } else {
      setStatus('disconnected');
      setStatusDetail("جاري الاتصال بخادم Render...");
      onStatusChange?.(false);
    }
    
    // ثم نقوم بالفحص لتحديث الحالة
    checkServerStatus();
    
    // فحص دوري كل 30 ثانية
    const intervalId = setInterval(checkServerStatus, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
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
                <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
              )}
              
              {showText && (
                <span 
                  className={cn(
                    "text-sm",
                    status === 'connected' && "text-green-600",
                    status === 'disconnected' && "text-yellow-600",
                    status === 'checking' && "text-yellow-600"
                  )}
                >
                  {status === 'checking' ? 'جاري الفحص...' : 
                   status === 'connected' ? 'خادم Render متصل' : `جاري الاتصال بـ Render${retryAttempt > 0 ? ` (محاولة #${retryAttempt})` : '...'}`}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{statusDetail}</p>
            <div className="flex justify-between items-center mt-2">
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-xs underline"
                onClick={checkServerStatus} 
                disabled={isChecking}
              >
                تحديث الحالة
              </Button>
              {status === 'disconnected' && (
                <span className="text-xs text-yellow-600">
                  {retryAttempt > 0 ? `محاولة إعادة الاتصال #${retryAttempt}` : ''}
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ConnectionStatusIndicator;
