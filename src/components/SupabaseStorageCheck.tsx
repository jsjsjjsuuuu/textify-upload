
import { useEffect, useState } from 'react';
import { ensureStorageBucket } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';

/**
 * مكون للتحقق من وجود وحالة تخزين Supabase عند بدء التطبيق
 */
const SupabaseStorageCheck = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const checkStorage = async () => {
      try {
        setIsChecking(true);
        
        // التحقق من وجود السلة وإنشائها إذا لم تكن موجودة
        const result = await ensureStorageBucket();
        
        if (!result) {
          console.error('فشل التحقق من أو إنشاء سلة التخزين');
          setIsHealthy(false);
          
          // إظهار إشعار فقط إذا كانت هذه المحاولة الأولى
          if (checkAttempts === 0) {
            toast({
              title: 'مشكلة في التخزين',
              description: 'هناك مشكلة في خدمة التخزين. يرجى النقر على "إعادة المحاولة" أدناه.',
              variant: 'destructive',
            });
          }
        } else {
          setIsHealthy(true);
          
          // عرض رسالة نجاح إذا كانت هناك محاولة سابقة فاشلة
          if (checkAttempts > 0 && !isHealthy) {
            toast({
              title: 'تم الاتصال بنجاح',
              description: 'تم الاتصال بخدمة التخزين بنجاح!',
              variant: 'default',
            });
          }
        }
      } catch (error: any) {
        console.error('خطأ أثناء التحقق من تخزين Supabase:', error);
        setIsHealthy(false);
        
        // إظهار إشعار فقط إذا كانت هذه المحاولة الأولى
        if (checkAttempts === 0) {
          toast({
            title: 'خطأ في التخزين',
            description: `فشل الاتصال بخدمة التخزين: ${error.message}`,
            variant: 'destructive',
          });
        }
      } finally {
        setIsChecking(false);
        setCheckAttempts(prev => prev + 1);
      }
    };
    
    // التحقق من التخزين عند تحميل المكون
    checkStorage();
    
    // إعادة التحقق كل 30 ثانية إذا لم تكن الخدمة صحية
    const interval = !isHealthy ? setInterval(checkStorage, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [toast, isHealthy, checkAttempts]);

  const handleRetry = async () => {
    setIsCreating(true);
    setCheckAttempts(0); // إعادة تعيين عدد المحاولات
    
    try {
      const result = await ensureStorageBucket();
      if (result) {
        setIsHealthy(true);
        toast({
          title: 'تم بنجاح',
          description: 'تم إعداد خدمة التخزين بنجاح',
          variant: 'default',
        });
      } else {
        toast({
          title: 'فشل الإعداد',
          description: 'لم نتمكن من إعداد خدمة التخزين. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: `فشل إعداد خدمة التخزين: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isChecking && checkAttempts === 0) {
    return null; // لا نعرض شيئًا أثناء التحقق الأولي
  }

  if (!isHealthy) {
    return (
      <div className="p-4 max-w-3xl mx-auto mt-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>مشكلة في خدمة التخزين</AlertTitle>
          <AlertDescription>
            <p className="mb-3">هناك مشكلة في الاتصال بخدمة تخزين الصور. قد لا تتمكن من رفع أو عرض الصور بشكل صحيح.</p>
            <div className="flex gap-2 items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                disabled={isCreating}
                className="gap-1.5 items-center flex"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    جاري المحاولة...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    إعادة المحاولة
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                المحاولة رقم {checkAttempts}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // عرض إشعار لفترة وجيزة عند نجاح الاتصال بعد فشل سابق
  if (isHealthy && checkAttempts > 1) {
    setTimeout(() => {
      setCheckAttempts(0); // إعادة تعيين بعد إظهار الإشعار
    }, 3000);
    
    return (
      <div className="p-4 max-w-3xl mx-auto mt-4">
        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/40">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-400">تم الاتصال بنجاح</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            تم الاتصال بخدمة تخزين الصور بنجاح. يمكنك الآن رفع وعرض الصور بشكل طبيعي.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null; // لا نعرض شيئًا إذا كان كل شيء يعمل بشكل صحيح
};

export default SupabaseStorageCheck;
