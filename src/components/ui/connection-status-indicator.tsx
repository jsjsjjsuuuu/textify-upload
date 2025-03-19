import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Clock, ExternalLink, Server, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { checkConnection, getLastConnectionStatus, RENDER_ALLOWED_IPS, isPreviewEnvironment } from "@/utils/automationServerUrl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  
  // تحقق مما إذا كنا في بيئة معاينة
  useEffect(() => {
    setIsPreview(isPreviewEnvironment());
  }, []);
  
  const checkServerStatus = async (specificIp?: string) => {
    if (isChecking) return; // تجنب تكرار الفحص إذا كان هناك فحص قيد التقدم
    
    setIsChecking(true);
    setStatus('checking');
    
    try {
      // في بيئة المعاينة، محاكاة الاتصال الناجح
      if (isPreview) {
        setStatus('connected');
        setStatusDetail("محاكاة الاتصال الناجح في بيئة المعاينة");
        setRetryAttempt(0);
        onStatusChange?.(true);
        setIsChecking(false);
        return;
      }
      
      const connectionResult = await checkConnection();
      
      if (connectionResult.isConnected) {
        setStatus('connected');
        setStatusDetail("متصل بخادم Render");
        setRetryAttempt(0);
        onStatusChange?.(true);
        
        if (specificIp) {
          toast.success(`تم الاتصال بنجاح باستخدام IP: ${specificIp}`);
        }
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
            { 
              duration: 10000,
              action: {
                label: "معلومات إضافية",
                onClick: () => {
                  window.open("https://docs.render.com/network", "_blank");
                }
              }
            }
          );
        }
        
        // محاولة إعادة الاتصال تلقائيًا - استخدام فترة انتظار متزايدة
        const retryDelay = Math.min(5000 + (retryAttempt * 1000), 15000);
        setTimeout(() => checkServerStatus(), retryDelay);
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
      setTimeout(() => checkServerStatus(), retryDelay);
    } finally {
      setIsChecking(false);
    }
  };
  
  // محاولة الاتصال باستخدام عنوان IP محدد
  const tryWithSpecificIp = (ip: string) => {
    setSelectedIp(ip);
    checkServerStatus(ip);
  };
  
  // فحص الحالة عند تحميل المكون
  useEffect(() => {
    // نحصل أولاً على الحالة المخزنة
    const storedStatus = getLastConnectionStatus();
    
    // في بيئة المعاينة، تعيين حالة متصل افتراضيًا
    if (isPreview) {
      setStatus('connected');
      setStatusDetail("متصل بخادم Render (محاكاة)");
      onStatusChange?.(true);
      return;
    }
    
    if (storedStatus.isConnected) {
      setStatus('connected');
      setStatusDetail("متصل بخادم Render");
      onStatusChange?.(true);
    } else {
      setStatus('disconnected');
      setStatusDetail("جاري الاتصال بخادم Render...");
      onStatusChange?.(false);
    }
    
    // ثم نقوم بالفحص لتحديث الحالة (تجنب الفحص المتكرر في بيئة المعاينة)
    if (!isPreview) {
      checkServerStatus();
      
      // فحص دوري كل 30 ثانية
      const intervalId = setInterval(() => checkServerStatus(), 30000);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isPreview]);
  
  const formatElapsedTime = (timestamp: number): string => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} ثانية`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} دقيقة`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)} ساعة`;
    }
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={cn("flex items-center gap-2 cursor-pointer", className)}>
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
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            {status === 'connected' ? (
              <Wifi className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <Wifi className="h-5 w-5 text-yellow-600 animate-pulse mt-0.5" />
            )}
            <div>
              <h4 className="font-medium">
                {status === 'connected' ? 'خادم Render متصل' : 'حالة اتصال خادم Render'}
              </h4>
              <p className="text-sm text-muted-foreground">{statusDetail}</p>
              {retryAttempt > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  عدد محاولات الاتصال: {retryAttempt}
                </p>
              )}
            </div>
          </div>
          
          {status !== 'connected' && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">جرب الاتصال باستخدام عنوان IP مختلف:</h5>
              <div className="grid grid-cols-2 gap-2">
                {RENDER_ALLOWED_IPS.map((ip) => (
                  <Button 
                    key={ip} 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "text-xs justify-start",
                      selectedIp === ip && "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    )}
                    onClick={() => tryWithSpecificIp(ip)}
                    disabled={isChecking}
                  >
                    <Server className="h-3 w-3 mr-1" />
                    {ip}
                  </Button>
                ))}
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded-md mt-2">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  يمكن لخادم Render استخدام عناوين IP مختلفة. محاولة تبديل عنوان IP قد يساعد في بعض الأحيان على تجاوز مشكلات الشبكة.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center border-t pt-2">
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs underline"
              onClick={() => checkServerStatus()} 
              disabled={isChecking}
            >
              تحديث الحالة
            </Button>
            {status === 'disconnected' && (
              <span className="text-xs text-yellow-600">
                {retryAttempt > 0 ? `آخر محاولة منذ ${formatElapsedTime(getLastConnectionStatus().lastChecked)}` : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <a 
              href="https://docs.render.com/network" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center hover:underline"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              دليل Render
            </a>
            <Button
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto text-xs"
              onClick={() => window.location.href = '/server-settings'}
            >
              <Settings className="h-3 w-3 mr-1" />
              إعدادات الخادم
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ConnectionStatusIndicator;
