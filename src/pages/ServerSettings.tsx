
import React, { useState, useEffect } from 'react';
import { 
  getAutomationServerUrl, 
  setAutomationServerUrl, 
  resetAutomationServerUrl,
  isValidServerUrl,
  getLastConnectionStatus,
  isConnected,
  checkConnection
} from '../utils/automationServerUrl';
import { AutomationService } from '../utils/automationService';
import { toast } from 'sonner';
import ServerSettingsComponent from '@/components/ServerSettings';

const ServerSettings = () => {
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [reconnectStatus, setReconnectStatus] = useState<{
    active: boolean;
    lastAttempt: number;
    attempts: number;
  }>({
    active: false,
    lastAttempt: 0,
    attempts: 0
  });
  
  // تحميل الإعدادات عند بدء الصفحة
  useEffect(() => {
    // استرجاع عنوان URL الحالي عند تحميل الصفحة
    const currentUrl = getAutomationServerUrl();
    setServerUrl(currentUrl);
    console.log("تم تحميل عنوان URL الحالي:", currentUrl);
    
    // التحقق من حالة الخادم عند تحميل الصفحة
    checkServerStatus();
    
    // بدء إعادة الاتصال التلقائي إذا كان مفعلًا
    if (autoReconnect) {
      startAutoReconnect();
    }
    
    // تحقق من حالة الاتصال الحالية
    isConnected(true).then(connected => {
      setServerStatus(connected ? 'online' : 'offline');
      if (connected) {
        toast.success("الخادم متصل ومستجيب");
      }
    });
    
    // تنظيف عند إزالة المكون
    return () => {
      AutomationService.stopReconnect();
    };
  }, []);
  
  // تابع للتعامل مع تغيير وضع إعادة الاتصال التلقائي
  useEffect(() => {
    if (autoReconnect) {
      startAutoReconnect();
    } else {
      AutomationService.stopReconnect();
      setReconnectStatus(prev => ({ ...prev, active: false }));
    }
  }, [autoReconnect]);
  
  const startAutoReconnect = () => {
    if (serverStatus === 'offline') {
      setReconnectStatus({
        active: true,
        lastAttempt: Date.now(),
        attempts: getLastConnectionStatus().retryCount
      });
      
      AutomationService.startAutoReconnect((isConnected) => {
        if (isConnected) {
          setServerStatus('online');
          checkServerStatus(false);
        } else {
          setServerStatus('offline');
        }
        
        setReconnectStatus({
          active: !isConnected,
          lastAttempt: Date.now(),
          attempts: getLastConnectionStatus().retryCount
        });
      });
    }
  };
  
  const handleServerUrlChange = (url: string) => {
    setServerUrl(url);
    // لا نحتاج إلى استدعاء setAutomationServerUrl هنا بعد الآن
    // لأننا قمنا بنقل هذه الوظيفة إلى داخل المكون ServerUrlConfigurator
  };
  
  const handleSaveUrl = () => {
    try {
      // التحقق من صحة URL
      if (!isValidServerUrl(serverUrl)) {
        toast.error('يرجى إدخال عنوان URL صحيح');
        return;
      }
      
      // حفظ URL الجديد وتحديث الواجهة
      setAutomationServerUrl(serverUrl);
      toast.success('تم حفظ عنوان الخادم بنجاح');
      console.log("تم حفظ عنوان URL الجديد:", serverUrl);
      
      // إعادة تحميل الصفحة لتطبيق الإعدادات الجديدة
      // هذا مهم لتطبيق العنوان الجديد بشكل صحيح في جميع أنحاء التطبيق
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ عنوان الخادم');
      console.error("خطأ في حفظ العنوان:", error);
    }
  };
  
  const handleResetUrl = () => {
    resetAutomationServerUrl();
    const defaultUrl = getAutomationServerUrl();
    setServerUrl(defaultUrl);
    toast.success('تم إعادة تعيين عنوان الخادم إلى القيمة الافتراضية');
    console.log("تم إعادة تعيين العنوان إلى:", defaultUrl);
    
    // إعادة تحميل الصفحة لتطبيق الإعدادات الافتراضية
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };
  
  const checkServerStatus = async (showToasts = true) => {
    setServerStatus('checking');
    setIsLoading(true);
    
    try {
      const currentUrl = getAutomationServerUrl();
      console.log("التحقق من حالة الخادم:", currentUrl);
      
      // استخدام طريقة checkConnection الجديدة للتحقق من الاتصال أولاً
      const connectionCheck = await checkConnection();
      
      if (connectionCheck.isConnected) {
        // إذا نجح فحص الاتصال، استمر للحصول على معلومات الخادم
        const result = await AutomationService.checkServerStatus(showToasts);
        setServerStatus('online');
        setServerInfo(result);
        
        if (showToasts) {
          toast.success('الخادم متصل ويعمل بشكل صحيح');
        }
        
        // إيقاف إعادة المحاولة إذا كانت نشطة
        AutomationService.stopReconnect();
        setReconnectStatus(prev => ({ ...prev, active: false }));
      } else {
        throw new Error(connectionCheck.message);
      }
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      setServerStatus('offline');
      setServerInfo(null);
      
      if (showToasts) {
        toast.error(`تعذر الاتصال بالخادم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
      
      // بدء إعادة المحاولة التلقائية إذا كان مفعلًا
      if (autoReconnect) {
        startAutoReconnect();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <ServerSettingsComponent
      serverUrl={serverUrl}
      serverStatus={serverStatus}
      serverInfo={serverInfo}
      isLoading={isLoading}
      autoReconnect={autoReconnect}
      reconnectStatus={reconnectStatus}
      onServerUrlChange={handleServerUrlChange}
      onCheckStatus={() => checkServerStatus()}
      onSaveUrl={handleSaveUrl}
      onResetUrl={handleResetUrl}
      onAutoReconnectChange={setAutoReconnect}
      onEnableAutoReconnect={() => setAutoReconnect(true)}
    />
  );
};

export default ServerSettings;
