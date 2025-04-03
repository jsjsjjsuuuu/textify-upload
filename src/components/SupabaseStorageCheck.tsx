
import { useEffect, useState } from 'react';
import { ensureStorageBucket } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * مكون للتحقق من وجود وحالة تخزين Supabase عند بدء التطبيق
 */
const SupabaseStorageCheck = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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
          toast({
            title: 'مشكلة في التخزين',
            description: 'هناك مشكلة في خدمة التخزين. قد لا تتمكن من رفع أو عرض الصور بشكل صحيح.',
            variant: 'destructive',
          });
        } else {
          setIsHealthy(true);
        }
      } catch (error: any) {
        console.error('خطأ أثناء التحقق من تخزين Supabase:', error);
        setIsHealthy(false);
        toast({
          title: 'خطأ في التخزين',
          description: `فشل الاتصال بخدمة التخزين: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setIsChecking(false);
      }
    };
    
    // التحقق من التخزين عند تحميل المكون
    checkStorage();
  }, [toast]);

  const handleRetry = async () => {
    setIsCreating(true);
    try {
      const result = await ensureStorageBucket();
      if (result) {
        setIsHealthy(true);
        toast({
          title: 'تم بنجاح',
          description: 'تم إعداد خدمة التخزين بنجاح',
        });
      } else {
        toast({
          title: 'فشل الإعداد',
          description: 'لم نتمكن من إعداد خدمة التخزين. يرجى المحاولة مرة أخرى لاحقًا.',
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

  if (isChecking) {
    return null; // لا نعرض شيئًا أثناء التحقق
  }

  if (!isHealthy) {
    return (
      <div className="p-4 max-w-3xl mx-auto mt-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>مشكلة في خدمة التخزين</AlertTitle>
          <AlertDescription>
            هناك مشكلة في خدمة التخزين. قد لا تتمكن من رفع أو عرض الصور بشكل صحيح.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    جاري المحاولة...
                  </>
                ) : (
                  'إعادة المحاولة'
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null; // لا نعرض شيئًا إذا كان كل شيء يعمل بشكل صحيح
};

export default SupabaseStorageCheck;
