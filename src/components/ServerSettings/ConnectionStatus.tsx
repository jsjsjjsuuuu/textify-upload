
import React from "react";
import { AlertCircle, CheckCircle2, RefreshCw, Clock, Wifi, WifiOff, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatElapsedTime } from "./utils";
import { getAutomationServerUrl } from "@/utils/automationServerUrl";

interface ConnectionStatusProps {
  status: 'idle' | 'checking' | 'online' | 'offline';
  isLoading: boolean;
  reconnectStatus: {
    active: boolean;
    lastAttempt: number;
    attempts: number;
  };
  autoReconnect: boolean;
  onCheckStatus: () => void;
  onEnableAutoReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  isLoading,
  reconnectStatus,
  autoReconnect,
  onCheckStatus,
  onEnableAutoReconnect
}) => {
  // الحصول على عنوان الخادم الحالي
  const currentServerUrl = getAutomationServerUrl();
  
  // فتح عنوان الخادم في نافذة جديدة
  const openServerInNewTab = () => {
    if (currentServerUrl) {
      window.open(currentServerUrl, '_blank');
    }
  };
  
  if (status === 'online') {
    return (
      <Alert variant="default" className="bg-green-50 border-green-300 shadow-sm">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 font-semibold text-lg mb-1">الخادم متصل ومستجيب</AlertTitle>
        <AlertDescription className="text-green-700">
          <p className="mb-3">تم التحقق من الاتصال بالخادم بنجاح. يمكنك الآن استخدام ميزات الأتمتة الفعلية.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCheckStatus}
              disabled={isLoading}
              className="bg-white border-green-200 hover:bg-green-50 hover:border-green-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''} text-green-600`} />
              تحديث الحالة
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={openServerInNewTab}
              className="bg-white border-green-200 hover:bg-green-50 hover:border-green-300"
            >
              <ExternalLink className="h-4 w-4 mr-2 text-green-600" />
              فتح الخادم في نافذة جديدة
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'offline') {
    return (
      <Alert variant="destructive" className="border-2">
        <WifiOff className="h-5 w-5" />
        <AlertTitle className="font-semibold text-lg mb-1">تعذر الاتصال بالخادم</AlertTitle>
        <AlertDescription>
          <p className="mb-2">تأكد من أن خادم الأتمتة يعمل وأن العنوان المدخل صحيح.</p>
          
          <div className="my-3 p-3 bg-destructive/5 rounded-md border border-destructive/30">
            <p className="text-sm mb-2 font-medium">آخر عنوان URL مستخدم:</p>
            <code className="bg-white/10 px-2 py-1 rounded text-xs block mb-3 overflow-x-auto">{currentServerUrl}</code>
            
            <Button
              variant="outline"
              size="sm"
              onClick={openServerInNewTab}
              className="mb-2 bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              زيارة عنوان الخادم مباشرة
            </Button>
            
            <p className="text-xs mt-2">
              قد يكون زيارة الخادم مباشرة يساعد في تنشيطه إذا كان في وضع السكون (Render).
            </p>
          </div>
          
          {reconnectStatus.active && (
            <div className="mt-3 mb-3 p-3 bg-destructive/10 rounded-md flex items-center gap-2 border-l-4 border-destructive">
              <Clock className="h-4 w-4 animate-pulse" />
              <span className="text-sm">
                جاري محاولة إعادة الاتصال
                {reconnectStatus.attempts > 0 && ` (المحاولة #${reconnectStatus.attempts})`}
                {reconnectStatus.lastAttempt > 0 && ` آخر محاولة منذ ${formatElapsedTime(reconnectStatus.lastAttempt)}`}
              </span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCheckStatus}
              disabled={isLoading}
              className="bg-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              إعادة المحاولة يدويًا
            </Button>
            {!autoReconnect && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={onEnableAutoReconnect}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Wifi className="h-4 w-4 mr-2" />
                تفعيل إعادة الاتصال التلقائي
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'checking') {
    return (
      <Alert variant="default" className="bg-amber-50 border-amber-300 shadow-sm">
        <RefreshCw className="h-5 w-5 text-amber-600 animate-spin" />
        <AlertTitle className="text-amber-800 font-semibold text-lg mb-1">جاري التحقق من حالة الخادم...</AlertTitle>
        <AlertDescription className="text-amber-700">
          الرجاء الانتظار بينما نتحقق من حالة الاتصال بخادم الأتمتة...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className="bg-slate-50 shadow-sm">
      <AlertCircle className="h-5 w-5 text-slate-600" />
      <AlertTitle className="text-slate-800 font-semibold text-lg mb-1">لم يتم التحقق من الحالة بعد</AlertTitle>
      <AlertDescription className="text-slate-700">
        <p className="mb-2">اضغط على زر فحص الاتصال للتحقق من حالة الخادم.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCheckStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            فحص الاتصال
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openServerInNewTab}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            زيارة عنوان الخادم
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ConnectionStatus;
