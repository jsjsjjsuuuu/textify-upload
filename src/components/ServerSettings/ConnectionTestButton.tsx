
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkConnection } from "@/utils/automationServerUrl";

interface ConnectionTestButtonProps {
  onConnectionResult?: (isConnected: boolean) => void;
  className?: string;
  showFullText?: boolean;
}

const ConnectionTestButton: React.FC<ConnectionTestButtonProps> = ({ 
  onConnectionResult,
  className,
  showFullText = true
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  
  const testConnection = async () => {
    setIsTesting(true);
    
    try {
      // إظهار رسالة أثناء الاختبار
      const toastId = toast({
        title: "جاري اختبار الاتصال",
        description: "يتم التحقق من الاتصال بخادم Render...",
        duration: 5000,
      });
      
      const result = await checkConnection();
      
      if (result.isConnected) {
        toast({
          title: "متصل بخادم Render",
          description: "تم الاتصال بخادم Render بنجاح.",
          variant: "default",
        });
      } else {
        toast({
          title: "فشل الاتصال",
          description: result.message || "تعذر الاتصال بخادم Render. تأكد من أن الخادم يعمل وأن عنوان URL صحيح.",
          variant: "destructive",
          duration: 8000,
        });
      }
      
      onConnectionResult?.(result.isConnected);
    } catch (error) {
      // تحسين رسالة الخطأ لتوفير المزيد من المعلومات
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء الاتصال بخادم Render";
      const detailedError = errorMessage.includes("Failed to fetch") 
        ? "تعذر الوصول إلى الخادم. تأكد من أن خادم Render يعمل وإمكانية الوصول إليه من الإنترنت."
        : errorMessage;
      
      toast({
        title: "خطأ في الاتصال",
        description: detailedError,
        variant: "destructive",
        duration: 10000,
      });
      
      onConnectionResult?.(false);
    } finally {
      setIsTesting(false);
    }
  };
  
  // فحص الاتصال عند تحميل المكون
  useEffect(() => {
    // التحقق من الاتصال تلقائيًا عند تحميل المكون
    testConnection();
    
    // فحص الاتصال كل 30 ثانية
    const intervalId = setInterval(() => {
      testConnection();
    }, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return (
    <Button
      onClick={testConnection}
      disabled={isTesting}
      variant="outline"
      className={className}
      size={showFullText ? "default" : "icon"}
    >
      {isTesting ? (
        <>
          <RefreshCw className={`${showFullText ? 'mr-2' : ''} h-4 w-4 animate-spin`} />
          {showFullText && "جاري الاختبار..."}
        </>
      ) : (
        <>
          <RefreshCw className={`${showFullText ? 'mr-2' : ''} h-4 w-4`} />
          {showFullText && "اختبار اتصال Render"}
        </>
      )}
    </Button>
  );
};

export default ConnectionTestButton;
