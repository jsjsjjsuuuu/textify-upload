
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { AutomationService } from '@/utils/automationService';
import { toast } from 'sonner';

interface ConnectionStatusIndicatorProps {
  onStatusChange?: (connected: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showRefresh?: boolean;
  hideText?: boolean;
}

export function ConnectionStatusIndicator({
  onStatusChange,
  size = 'md',
  showRefresh = true,
  hideText = false
}: ConnectionStatusIndicatorProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // التحقق من الاتصال كل دقيقة
    const interval = setInterval(() => {
      checkConnection(false);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];
  
  const buttonSize = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }[size];
  
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];
  
  const checkConnection = async (showNotifications = false) => {
    setIsChecking(true);
    setStatus('checking');
    
    try {
      // تعديل هنا، لا تمرير أي معلمات لـ checkServerStatus
      await AutomationService.checkServerStatus();
      setStatus('connected');
      
      if (onStatusChange) {
        onStatusChange(true);
      }
      
      if (showNotifications) {
        toast.success('تم الاتصال بخادم الأتمتة بنجاح');
      }
    } catch (error) {
      setStatus('disconnected');
      
      if (onStatusChange) {
        onStatusChange(false);
      }
      
      if (showNotifications) {
        toast.error('تعذر الاتصال بخادم الأتمتة');
      }
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {status === 'checking' ? (
        <RefreshCw className={`${iconSize} text-amber-500 animate-spin`} />
      ) : status === 'connected' ? (
        <CheckCircle className={`${iconSize} text-green-500`} />
      ) : (
        <XCircle className={`${iconSize} text-red-500`} />
      )}
      
      {!hideText && (
        <span className={`${textSize} ${status === 'connected' ? 'text-green-700' : status === 'disconnected' ? 'text-red-700' : 'text-amber-700'}`}>
          {status === 'checking' ? 'جاري التحقق...' : 
           status === 'connected' ? 'متصل' : 'غير متصل'}
        </span>
      )}
      
      {showRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className={buttonSize}
          disabled={isChecking}
          onClick={() => checkConnection(true)}
          title="إعادة التحقق من الاتصال"
        >
          <RefreshCw className={`${iconSize} ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
