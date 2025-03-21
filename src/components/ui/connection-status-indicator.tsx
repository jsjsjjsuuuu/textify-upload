
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionManager } from "@/utils/automation/connectionManager";
import { getLastConnectionStatus, isPreviewEnvironment, resetAutomationServerUrl } from "@/utils/automationServerUrl";
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
  const navigate = useNavigate();
  
  const checkConnectionStatus = async () => {
    setIsChecking(true);
    try {
      // في بيئة المعاينة، دائمًا نعتبر الاتصال ناجحًا
      if (isPreviewEnvironment()) {
        setIsConnected(true);
        onStatusChange?.(true);
        setIsChecking(false);
        return;
      }
      
      // عدد محاولات إعادة الاتصال الحالية
      const attempts = ConnectionManager.getReconnectAttempts();
      setReconnectAttempts(attempts);
      
      // التحقق من الاتصال الفعلي
      const status = await ConnectionManager.checkServerStatus(false);
      setServerInfo(status);
      setIsConnected(true);
      onStatusChange?.(true);
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
    }
  };
  
  // التحقق من الاتصال عند تحميل المكون
  useEffect(() => {
    // التحقق أولاً من الحالة المخزنة
    const savedStatus = getLastConnectionStatus();
    setIsConnected(savedStatus.isConnected);
    
    // التأكد من وجود عنوان URL للخادم
    const serverUrl = ConnectionManager.getServerUrl();
    if (!serverUrl) {
      console.warn("لم يتم العثور على عنوان URL للخادم، جاري إعادة تعيينه");
      resetAutomationServerUrl();
    }
    
    // ثم التحقق الفعلي من الاتصال
    checkConnectionStatus();
    
    // إعداد فاصل زمني للتحقق الدوري (كل 2 دقيقة)
    const intervalId = setInterval(checkConnectionStatus, 120000);
    
    return () => {
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
  
  const handleGoToSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/server-settings");
  };
  
  const getStatusText = () => {
    if (isPreviewEnvironment()) {
      return "متصل (بيئة معاينة)";
    }
    
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
              "inline-flex items-center gap-2 cursor-pointer",
              className
            )}
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
            ) : isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            
            {showText && (
              <span className={cn(
                "text-xs font-medium",
                isChecking ? "text-amber-600" : 
                isConnected ? "text-green-600" : 
                "text-red-600"
              )}>
                {getStatusText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-4 max-w-80 bg-white/95 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="font-medium">حالة اتصال خادم الأتمتة</div>
            
            {isPreviewEnvironment() ? (
              <p className="text-sm text-muted-foreground">
                أنت في بيئة معاينة. يتم محاكاة الاتصال بالخادم.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isConnected ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-sm">
                    {isConnected ? "متصل" : "غير متصل"}
                  </span>
                </div>
                
                {!isConnected && (
                  <div className="text-xs bg-red-50 text-red-800 p-2 rounded flex items-start gap-2 mt-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">تعذر الاتصال بخادم Render</p>
                      <p className="mt-1">قد يكون الخادم في وضع السكون أو غير متاح حالياً. جاري إعادة المحاولة تلقائياً.</p>
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
                  <Button variant="secondary" size="sm" onClick={handleManualCheck} className="w-full text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    إعادة الاتصال
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGoToSettings} className="w-full text-xs">
                    الإعدادات
                  </Button>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatusIndicator;
