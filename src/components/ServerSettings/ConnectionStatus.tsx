
import React from "react";
import { AlertCircle, CheckCircle2, RefreshCw, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatElapsedTime } from "./utils";

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
  if (status === 'online') {
    return (
      <Alert variant="default" className="bg-green-50 border-green-300">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">الخادم متصل ومستجيب</AlertTitle>
        <AlertDescription className="text-green-700">
          تم التحقق من الاتصال بالخادم بنجاح. يمكنك الآن استخدام ميزات الأتمتة.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'offline') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>تعذر الاتصال بالخادم</AlertTitle>
        <AlertDescription>
          تأكد من أن خادم الأتمتة يعمل وأن العنوان المدخل صحيح.
          {reconnectStatus.active && (
            <div className="mt-2 p-2 bg-destructive/10 rounded-md flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" />
              <span className="text-sm">
                جاري محاولة إعادة الاتصال. 
                {reconnectStatus.attempts > 0 && ` المحاولة #${reconnectStatus.attempts}.`}
                {reconnectStatus.lastAttempt > 0 && ` آخر محاولة منذ ${formatElapsedTime(reconnectStatus.lastAttempt)}.`}
              </span>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCheckStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              إعادة المحاولة
            </Button>
            {!autoReconnect && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEnableAutoReconnect}
              >
                تفعيل إعادة الاتصال التلقائي
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ConnectionStatus;
