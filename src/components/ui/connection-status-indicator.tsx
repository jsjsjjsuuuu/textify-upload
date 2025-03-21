
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Clock, AlertTriangle, Activity, ServerCrash } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutomationService } from "@/utils/automationService";
import { 
  getLastConnectionStatus, 
  resetAutomationServerUrl,
  checkConnection,
  getAutomationServerUrl,
  RENDER_ALLOWED_IPS
} from "@/utils/automationServerUrl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ServerStatusResponse } from "@/utils/automation/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ConnectionStatusIndicatorProps {
  className?: string;
  showText?: boolean;
  onStatusChange?: (isConnected: boolean) => void;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  className,
  showText = false,
  onStatusChange
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerStatusResponse | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const navigate = useNavigate();
  
  const checkConnectionStatus = async () => {
    setIsChecking(true);
    try {
      // دائمًا نتحقق من الاتصال الفعلي بالخادم
      
      // الحصول على عنوان الخادم
      const serverUrl = getAutomationServerUrl();
      
      // التحقق من الوصول السريع باستخدام نقطة نهاية /api/ping أولاً
      try {
        console.log(`محاولة اتصال سريع: ${serverUrl}/api/ping`);
        const pingResponse = await fetch(`${serverUrl}/api/ping`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache',
            'X-Request-Time': Date.now().toString()
          },
          mode: 'cors',
          credentials: 'omit',
          // مهلة قصيرة للفحص السريع
          signal: AbortSignal.timeout(10000)
        });
        
        if (pingResponse.ok) {
          console.log('Ping response successful:', await pingResponse.json());
          setIsConnected(true);
          onStatusChange?.(true);
          setLastCheckTime(new Date());
          setIsChecking(false);
          return;
        } else {
          console.warn('Ping response not OK:', pingResponse.status);
        }
      } catch (pingError) {
        console.warn('خطأ في الوصول لنقطة نهاية ping:', pingError);
      }
      
      // إذا فشل ping، نستخدم آلية checkConnection
      console.log('استخدام آلية checkConnection...');
      const result = await checkConnection();
      console.log('نتيجة checkConnection:', result);
      
      if (result.isConnected) {
        setIsConnected(true);
        onStatusChange?.(true);
        
        // عرض إشعار بنجاح الاتصال (فقط إذا كان هناك محاولات إعادة اتصال سابقة)
        if (reconnectAttempts > 0) {
          toast.success("تم استعادة الاتصال بخادم Render");
          setReconnectAttempts(0);
        }
      } else {
        setIsConnected(false);
        onStatusChange?.(false);
        
        // محاولة استخدام خدمة AutomationService كبديل
        try {
          const statusResult = await AutomationService.checkServerStatus(false);
          console.log('نتيجة AutomationService.checkServerStatus:', statusResult);
          
          if (statusResult) {
            setServerInfo(statusResult);
            setIsConnected(true);
            onStatusChange?.(true);
          }
        } catch (serviceError) {
          console.warn('فشل التحقق عبر AutomationService:', serviceError);
          // الاستمرار مع النتيجة السابقة (غير متصل)
        }
      }
    } catch (error) {
      console.error("فشل التحقق من حالة الاتصال:", error);
      setIsConnected(false);
      onStatusChange?.(false);
      
      // إذا كانت هناك محاولات متكررة فاشلة، فتح مربع حوار للمساعدة
      if (reconnectAttempts > 5) {
        toast.error("استمرار مشكلة اتصال خادم Render", {
          description: "هل ترغب في الانتقال إلى صفحة إعدادات الخادم لحل المشكلة؟",
          duration: 10000,
          action: {
            label: "إعدادات الخادم",
            onClick: () => {
              navigate("/server-settings");
            }
          }
        });
      }
    } finally {
      setIsChecking(false);
      setLastCheckTime(new Date());
    }
  };
  
  // التحقق من الاتصال عند تحميل المكون
  useEffect(() => {
    // التحقق أولاً من الحالة المخزنة
    const savedStatus = getLastConnectionStatus();
    setIsConnected(savedStatus.isConnected);
    setReconnectAttempts(savedStatus.retryCount || 0);
    
    // التأكد من وجود عنوان URL للخادم
    const serverUrl = getAutomationServerUrl();
    if (!serverUrl) {
      console.warn("لم يتم العثور على عنوان URL للخادم، جاري إعادة تعيينه");
      resetAutomationServerUrl();
    }
    
    // ثم التحقق الفعلي من الاتصال بعد فترة قصيرة
    const timer = setTimeout(() => {
      checkConnectionStatus();
    }, 1000);
    
    // إعداد فاصل زمني للتحقق الدوري (كل 30 ثانية)
    const intervalId = setInterval(checkConnectionStatus, 30000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, []);
  
  const handleManualCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("جاري التحقق من اتصال خادم Render...", {
      duration: 3000,
    });
    checkConnectionStatus();
  };
  
  const handleForceReconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecking(true);
    
    // محاولة إعادة الاتصال باستخدام كلا المنهجين
    try {
      await AutomationService.forceReconnect();
    } catch (error) {
      console.warn("فشل إعادة الاتصال باستخدام AutomationService:", error);
    }
    
    // ثم التحقق من الاتصال
    await checkConnectionStatus();
  };
  
  const handleGoToSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/server-settings");
  };
  
  const getStatusText = () => {
    if (isChecking) {
      return "جارٍ التحقق...";
    }
    
    if (isConnected === true) {
      return "متصل بالخادم";
    }
    
    if (isConnected === false) {
      return "غير متصل";
    }
    
    return "حالة الاتصال غير معروفة";
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            onClick={handleManualCheck}
            className={cn(
              "inline-flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md transition-colors",
              isChecking ? "bg-amber-50 dark:bg-amber-950/30" :
              isConnected ? "bg-green-50 dark:bg-green-950/30" : 
              "bg-red-50 dark:bg-red-950/30",
              className
            )}
          >
            {isChecking ? (
              <Activity className="h-4 w-4 animate-pulse text-amber-500" />
            ) : isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            
            {showText && (
              <span className={cn(
                "text-xs font-medium",
                isChecking ? "text-amber-600 dark:text-amber-400" : 
                isConnected ? "text-green-600 dark:text-green-400" : 
                "text-red-600 dark:text-red-400"
              )}>
                {getStatusText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-4 max-w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="font-medium">حالة اتصال خادم الأتمتة</div>
            
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm">
                {isConnected ? "متصل" : "غير متصل"}
              </span>
              {lastCheckTime && (
                <span className="text-xs text-muted-foreground mr-auto">
                  آخر تحديث: {lastCheckTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {!isConnected && (
              <div className="text-xs bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 p-2 rounded flex items-start gap-2 mt-2">
                <ServerCrash className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium">تعذر الاتصال بخادم Render</p>
                  <p className="mt-1">قد يكون الخادم في وضع السكون أو غير متاح حالياً. جاري إعادة المحاولة تلقائياً.</p>
                  <p className="mt-1 text-[10px] flex items-center">
                    <span className="font-mono bg-red-100 dark:bg-red-900 px-1 rounded">{getAutomationServerUrl()}</span>
                  </p>
                  {reconnectAttempts > 0 && (
                    <p className="mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>محاولات إعادة الاتصال: {reconnectAttempts}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {serverInfo && (
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <div>الوقت: {new Date(serverInfo.time).toLocaleTimeString()}</div>
                <div>مدة التشغيل: {Math.floor(serverInfo.uptime / 60)} دقيقة</div>
                <div>البيئة: {serverInfo.environment}</div>
              </div>
            )}
            
            <div className="flex gap-2 mt-2">
              {!isConnected ? (
                <Button variant="default" size="sm" onClick={handleForceReconnect} className="w-full text-xs bg-purple-600 hover:bg-purple-700">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  إعادة اتصال فورية
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleManualCheck} className="w-full text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  تحديث الحالة
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleGoToSettings} className="w-full text-xs">
                الإعدادات
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatusIndicator;
