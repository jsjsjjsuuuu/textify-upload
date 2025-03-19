
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, RefreshCw, Settings, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkConnection, RENDER_ALLOWED_IPS, getLastConnectionStatus, isPreviewEnvironment } from "@/utils/automationServerUrl";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface ConnectionTestButtonProps {
  onConnectionResult?: (isConnected: boolean) => void;
  className?: string;
  showFullText?: boolean;
  onOpenSettings?: () => void;
}

const ConnectionTestButton: React.FC<ConnectionTestButtonProps> = ({ 
  onConnectionResult,
  className,
  showFullText = true,
  onOpenSettings
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast: hookToast } = useToast();
  
  const testConnection = async () => {
    setIsTesting(true);
    setErrorDetails(null);
    
    try {
      // في بيئة المعاينة، محاكاة نجاح الاتصال
      if (isPreviewEnvironment()) {
        toast.success("متصل بخادم Render في بيئة المعاينة", {
          description: "تم محاكاة الاتصال بنجاح. (ملاحظة: هذه محاكاة في بيئة المعاينة)",
          duration: 5000
        });
        
        onConnectionResult?.(true);
        setIsTesting(false);
        return;
      }
      
      // إظهار رسالة أثناء الاختبار
      toast("جاري اختبار الاتصال", {
        description: "يتم التحقق من الاتصال بخادم Render...",
        duration: 5000,
      });
      
      // محاولة الاتصال
      const result = await checkConnection();
      
      if (result.isConnected) {
        toast.success("متصل بخادم Render", {
          description: "تم الاتصال بخادم Render بنجاح.",
          duration: 5000
        });
        
        // إعادة تعيين عداد المحاولات
        setRetryCount(0);
      } else {
        setErrorDetails(result.message);
        setRetryCount(prev => prev + 1);
        
        // تحسين رسالة الخطأ بناءً على عدد المحاولات
        const failMsg = retryCount > 2 
          ? "استمرار فشل الاتصال. يرجى التحقق من إعدادات الخادم وتجربة استخدام عنوان IP مختلف."
          : result.message || "تعذر الاتصال بخادم Render. تأكد من أن الخادم يعمل وأن عنوان URL صحيح.";
          
        toast.error("فشل الاتصال", {
          description: failMsg,
          duration: 10000,
          action: {
            label: "إعدادات الخادم",
            onClick: onOpenSettings
          }
        });
      }
      
      onConnectionResult?.(result.isConnected);
    } catch (error) {
      // تحسين رسالة الخطأ لتوفير المزيد من المعلومات
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء الاتصال بخادم Render";
      
      // تخزين تفاصيل الخطأ لعرضها في البوبوفر
      setErrorDetails(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // تخصيص رسائل الخطأ لتسهيل فهمها
      let detailedError = errorMessage;
      
      if (errorMessage.includes("Failed to fetch")) {
        detailedError = "تعذر الوصول إلى خادم Render. قد يكون الخادم غير متاح أو هناك مشكلة في الشبكة. حاول التحقق من الإعدادات والاتصال بالإنترنت.";
      } else if (errorMessage.includes("aborted")) {
        detailedError = "انتهت مهلة الاتصال. قد تكون سرعة الاتصال بالإنترنت بطيئة أو الخادم غير مستجيب.";
      }
      
      toast.error("خطأ في الاتصال", {
        description: detailedError,
        duration: 10000,
        action: {
          label: "إعدادات الخادم",
          onClick: onOpenSettings
        }
      });
      
      onConnectionResult?.(false);
    } finally {
      setIsTesting(false);
    }
  };
  
  useEffect(() => {
    // التحقق من الاتصال تلقائيًا عند تحميل المكون
    testConnection();
    
    // لا نحتاج إلى فحص الاتصال بشكل متكرر في بيئة المعاينة
    if (isPreviewEnvironment()) {
      return;
    }
    
    // فحص الاتصال كل 30 ثانية
    const intervalId = setInterval(() => {
      const status = getLastConnectionStatus();
      
      // إذا فشل الاتصال أكثر من 10 مرات، زيادة الفاصل الزمني لتقليل طلبات الشبكة
      if (status.retryCount > 10) {
        clearInterval(intervalId);
        
        // إعادة تعيين الفاصل الزمني إلى دقيقة واحدة بدلاً من 30 ثانية
        const longerIntervalId = setInterval(() => {
          testConnection();
        }, 60000);
        
        return () => {
          clearInterval(longerIntervalId);
        };
      }
      
      testConnection();
    }, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // عرض عدد المحاولات فقط إذا كان هناك أكثر من محاولة فاشلة
  const showRetryCount = retryCount > 0 && errorDetails;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      {errorDetails && (
        <PopoverContent className="w-96">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium">خطأ في الاتصال بخادم Render</h4>
                <p className="text-sm text-muted-foreground">{errorDetails}</p>
                {showRetryCount && (
                  <p className="text-xs text-muted-foreground mt-2">
                    عدد المحاولات: {retryCount}
                  </p>
                )}
              </div>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <h5 className="text-sm font-medium">الحلول المقترحة:</h5>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>تأكد من أن خادم Render يعمل ويمكن الوصول إليه من الإنترنت</li>
                <li>تحقق من إعدادات URL الخادم في صفحة إعدادات الخادم</li>
                <li>تفعيل خيار إعادة الاتصال التلقائي</li>
                <li>جرب تبديل عنوان IP المستخدم للاتصال</li>
              </ul>
              
              <div className="flex items-center gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={testConnection} 
                  disabled={isTesting}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  إعادة المحاولة
                </Button>
                
                {onOpenSettings && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onOpenSettings} 
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    إعدادات الخادم
                  </Button>
                )}
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                <a 
                  href="https://docs.render.com/network" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  مستندات Render لإعدادات الشبكة
                </a>
              </div>
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default ConnectionTestButton;
