
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StorageStatusIndicatorProps {
  showWhenHealthy?: boolean;
}

/**
 * مكون لعرض حالة التخزين للمستخدم
 */
const StorageStatusIndicator = ({ showWhenHealthy = false }: StorageStatusIndicatorProps) => {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkStorageStatus = async () => {
    try {
      setStatus('checking');
      setErrorMessage(null);
      
      // التحقق من وجود السلة
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('receipt_images');
      
      if (bucketError) {
        console.error('خطأ في التحقق من سلة التخزين:', bucketError);
        setStatus('unhealthy');
        setErrorMessage(bucketError.message);
        return;
      }
      
      // محاولة إجراء اختبار للتحقق من إمكانية الوصول
      const testContent = new Blob(['test'], { type: 'text/plain' });
      const testPath = `test-${Date.now()}.txt`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('receipt_images')
        .upload(testPath, testContent, { upsert: true });
      
      if (uploadError) {
        console.error('فشل اختبار رفع الملف:', uploadError);
        setStatus('unhealthy');
        setErrorMessage(`فشل اختبار الرفع: ${uploadError.message}`);
        return;
      }
      
      // محاولة جلب الرابط العام
      const { data: urlData } = await supabase
        .storage
        .from('receipt_images')
        .getPublicUrl(testPath);
      
      if (!urlData?.publicUrl) {
        setStatus('unhealthy');
        setErrorMessage('فشل الحصول على رابط عام للملف المرفوع');
        return;
      }
      
      // حذف ملف الاختبار
      await supabase
        .storage
        .from('receipt_images')
        .remove([testPath]);
      
      // كل شيء يعمل بشكل صحيح
      setStatus('healthy');
      
    } catch (error: any) {
      console.error('خطأ غير متوقع أثناء التحقق من حالة التخزين:', error);
      setStatus('unhealthy');
      setErrorMessage(error.message || 'خطأ غير معروف');
    }
  };

  useEffect(() => {
    checkStorageStatus();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkStorageStatus();
    setIsRetrying(false);
  };

  if (status === 'checking') {
    return (
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-300">جاري التحقق من حالة التخزين</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          يرجى الانتظار بينما نتحقق من اتصال التخزين...
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'unhealthy') {
    return (
      <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-800 dark:text-red-300">مشكلة في خدمة التخزين</AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-400">
          {errorMessage || 'هناك مشكلة في خدمة التخزين. قد لا تتمكن من رفع أو عرض الصور بشكل صحيح.'}
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="bg-white dark:bg-red-900/40 text-red-600 border-red-300"
            >
              {isRetrying ? 'جاري إعادة المحاولة...' : 'إعادة المحاولة'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'healthy' && showWhenHealthy) {
    return (
      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-300">خدمة التخزين تعمل بشكل صحيح</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          يمكنك رفع وعرض الصور بشكل طبيعي.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default StorageStatusIndicator;
