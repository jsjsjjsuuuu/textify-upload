
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Check, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  checkConnection, 
  RENDER_ALLOWED_IPS, 
  getLastConnectionStatus,
  isPreviewEnvironment
} from '@/utils/automationServerUrl';

const ConnectionTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ isConnected: false, message: 'لم يتم الاختبار بعد' });
  const { toast } = useToast();
  
  // للتحقق من حالة آخر اتصال عند التحميل
  useEffect(() => {
    const lastStatus = getLastConnectionStatus();
    if (lastStatus.timestamp > 0) {
      setStatus({ isConnected: lastStatus.isConnected, message: lastStatus.message });
    }
  }, []);
  
  const runConnectionTest = async () => {
    setIsLoading(true);
    
    try {
      const result = await checkConnection();
      setStatus(result);
      
      toast({
        title: result.isConnected ? 'تم الاتصال بنجاح' : 'فشل الاتصال',
        description: result.message,
        variant: result.isConnected ? 'default' : 'destructive'
      });
    } catch (error) {
      setStatus({ isConnected: false, message: error instanceof Error ? error.message : 'خطأ غير معروف' });
      
      toast({
        title: 'خطأ في الاتصال',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء محاولة الاتصال',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <Button
        variant="outline"
        onClick={runConnectionTest}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري اختبار الاتصال...
          </>
        ) : (
          <>اختبار الاتصال</>
        )}
      </Button>
      
      <div className="text-sm flex items-center">
        <span className="mr-2">الحالة:</span>
        {status.isConnected ? (
          <div className="flex items-center text-green-500">
            <Check className="h-4 w-4 mr-1" />
            <span>متصل</span>
          </div>
        ) : (
          <div className="flex items-center text-red-500">
            <XCircle className="h-4 w-4 mr-1" />
            <span>غير متصل</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">{status.message}</p>
    </div>
  );
};

export default ConnectionTestButton;
