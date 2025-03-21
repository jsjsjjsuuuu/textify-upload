import React, { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Circle, CheckCircle, AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react';
import {
  getAutomationServerUrl,
  getLastConnectionStatus,
  checkConnection,
} from '@/utils/automationServerUrl';
import { toast } from 'sonner';
import { Button } from './button';
import { AutomationService } from '@/utils/automationService';

interface ConnectionStatusIndicatorProps {
  className?: string;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ className }) => {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed' | 'unknown'>('unknown');
  const [isRetrying, setIsRetrying] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  useEffect(() => {
    const initialStatus = getLastConnectionStatus();
    if (initialStatus.isConnected) {
      setConnectionState('connected');
    } else {
      setConnectionState('unknown');
    }

    setServerUrl(getAutomationServerUrl());
    checkInitialConnection();

    const intervalId = setInterval(checkInitialConnection, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const checkInitialConnection = async () => {
    try {
      const connectionResult = await checkConnection();
      if (connectionResult.isConnected) {
        setConnectionState('connected');
      } else {
        setConnectionState('failed');
      }
    } catch (error) {
      console.error('فشل التحقق من حالة الاتصال:', error);
      setConnectionState('failed');
    }
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      // استخدام الدالة forceReconnect التي أضفناها
      const result = await AutomationService.forceReconnect();
      if (result) {
        setConnectionState('connected');
        toast.success('تم إعادة الاتصال بالخادم بنجاح');
      } else {
        setConnectionState('failed');
        toast.error('تعذر الاتصال بالخادم. يرجى التأكد من صحة عنوان الخادم وتوافره.');
      }
    } catch (error) {
      console.error('خطأ في إعادة الاتصال:', error);
      setConnectionState('failed');
      toast.error(`فشل محاولة إعادة الاتصال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsRetrying(false);
    }
  };

  let statusText = 'غير معروف';
  let statusIcon = <Circle className="h-4 w-4 animate-pulse text-gray-500" />;

  if (connectionState === 'connecting') {
    statusText = 'جاري الاتصال...';
    statusIcon = <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  } else if (connectionState === 'connected') {
    statusText = 'متصل';
    statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
  } else if (connectionState === 'failed') {
    statusText = 'فشل الاتصال';
    statusIcon = <AlertTriangle className="h-4 w-4 text-red-500" />;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant={connectionState === 'connected' ? 'success' : 'destructive'}>
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </Badge>
      {connectionState === 'failed' && (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={handleRetryConnection} disabled={isRetrying}>
            {isRetrying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>إعادة المحاولة...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                <span>إعادة المحاولة</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
