
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAutomationServerUrl, checkConnection } from '@/utils/automationServerUrl';
import { Link } from 'react-router-dom';
import { Cloud, Server, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AutomaticCloudServer = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [isAutoCreateEnabled, setIsAutoCreateEnabled] = useState(false);
  
  useEffect(() => {
    // التحقق مما إذا كان الإنشاء التلقائي مفعل في التخزين المحلي
    const autoCreate = localStorage.getItem('autoCreateCloudServer') === 'true';
    setIsAutoCreateEnabled(autoCreate);
    
    if (autoCreate) {
      checkServerStatus();
    }
  }, []);
  
  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      
      const result = await checkConnection();
      
      if (result.isConnected) {
        setServerStatus('ready');
        console.log('الخادم السحابي جاهز');
      } else {
        setServerStatus('error');
        
        // محاولة إنشاء خادم جديد إذا كان مفعلاً
        if (isAutoCreateEnabled) {
          triggerServerCreation();
        }
      }
    } catch (error) {
      console.error('خطأ في التحقق من حالة الخادم:', error);
      setServerStatus('error');
    }
  };
  
  const triggerServerCreation = async () => {
    try {
      // إظهار رسالة للمستخدم
      toast.info('جاري تهيئة الخادم السحابي، يرجى الانتظار...', { duration: 5000 });
      
      // استرجاع المزود المحدد من التخزين المحلي
      const provider = localStorage.getItem('cloudServerProvider') || 'render';
      
      // محاكاة إنشاء الخادم (في التطبيق الحقيقي، سيكون هذا طلب API فعلي)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const serverUrl = provider === 'render' 
        ? 'https://textify-upload.onrender.com' 
        : 'https://textify-automation.railway.app';
      
      // حفظ عنوان الخادم الجديد
      localStorage.setItem('cloudServerUrl', serverUrl);
      
      // التحقق من الاتصال بالخادم الجديد
      await checkServerStatus();
      
      // إظهار رسالة نجاح
      if (serverStatus === 'ready') {
        toast.success('تم تهيئة الخادم السحابي بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إنشاء الخادم:', error);
      toast.error('حدث خطأ أثناء تهيئة الخادم السحابي');
    }
  };
  
  // لا نعرض أي واجهة إذا تم تعطيل الإنشاء التلقائي
  if (!isAutoCreateEnabled) {
    return null;
  }
  
  if (serverStatus === 'ready') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/cloud-server" className="flex items-center gap-1 text-xs text-green-600 hover:underline">
              <Server className="h-3 w-3" />
              <span>الخادم السحابي جاهز</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>الخادم السحابي يعمل بنجاح</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (serverStatus === 'error') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs text-yellow-600 hover:text-yellow-800" onClick={triggerServerCreation}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>إعادة تهيئة الخادم</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>انقر لإعادة تهيئة الخادم السحابي</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Cloud className="h-3 w-3 animate-pulse" />
            <span>جاري تهيئة الخادم...</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>جاري تهيئة الخادم السحابي، يرجى الانتظار</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AutomaticCloudServer;
