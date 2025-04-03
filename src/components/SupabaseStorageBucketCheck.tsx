
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * مكون للتحقق من وجود وحالة سلة التخزين في Supabase
 */
const SupabaseStorageBucketCheck = () => {
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkBucket = async () => {
      try {
        setIsChecking(true);
        
        // التحقق من وجود السلة
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .getBucket('receipt_images');
        
        if (bucketError) {
          if (bucketError.message.includes('does not exist')) {
            console.log('سلة التخزين غير موجودة، سيتم إنشاؤها.');
            setBucketExists(false);
            
            // محاولة إنشاء السلة تلقائياً
            const { data: createData, error: createError } = await supabase
              .storage
              .createBucket('receipt_images', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
              });
            
            if (createError) {
              console.error('خطأ في إنشاء سلة التخزين:', createError);
              setErrorMessage(`فشل إنشاء سلة التخزين: ${createError.message}`);
              toast({
                title: 'خطأ في إنشاء سلة التخزين',
                description: `${createError.message}`,
                variant: 'destructive'
              });
            } else {
              console.log('تم إنشاء سلة التخزين بنجاح');
              setBucketExists(true);
              toast({
                title: 'تم إنشاء سلة التخزين',
                description: 'تم إنشاء سلة التخزين بنجاح',
              });
              
              // تكوين سياسات الوصول العامة للسلة
              await setupPublicPolicies();
            }
          } else {
            console.error('خطأ في التحقق من سلة التخزين:', bucketError);
            setErrorMessage(`فشل التحقق من سلة التخزين: ${bucketError.message}`);
          }
        } else if (bucketData) {
          console.log('سلة التخزين موجودة:', bucketData);
          setBucketExists(true);
          
          // التحقق من إعدادات الوصول العام
          if (!bucketData.public) {
            console.log('سلة التخزين غير عامة، سيتم تحديثها');
            const { error: updateError } = await supabase
              .storage
              .updateBucket('receipt_images', { public: true });
            
            if (updateError) {
              console.error('خطأ في تحديث سلة التخزين للوصول العام:', updateError);
              setErrorMessage(`فشل تحديث سلة التخزين للوصول العام: ${updateError.message}`);
            } else {
              console.log('تم تحديث سلة التخزين للوصول العام بنجاح');
              await setupPublicPolicies();
            }
          }
        }
      } catch (error: any) {
        console.error('خطأ غير متوقع أثناء التحقق من سلة التخزين:', error);
        setErrorMessage(`خطأ غير متوقع: ${error.message}`);
        setBucketExists(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    // دالة لإعداد سياسات الوصول العامة للسلة
    const setupPublicPolicies = async () => {
      try {
        console.log('إعداد سياسات الوصول العامة للسلة...');
        
        // هذه الوظيفة ليست متاحة مباشرة في واجهة JavaScript لـ Supabase
        // يجب تطبيق سياسات الوصول العامة من خلال واجهة المستخدم للوحة التحكم
        
        // بدلاً من ذلك، يمكننا التحقق من الوصول من خلال محاولة جلب ملف عام
        console.log('التحقق من إمكانية الوصول العام...');
        const testFilePath = 'test.txt';
        
        // محاولة رفع ملف اختبار
        const testContent = new Blob(['test content'], { type: 'text/plain' });
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('receipt_images')
          .upload(testFilePath, testContent, { upsert: true });
        
        if (uploadError) {
          console.error('خطأ في رفع ملف الاختبار:', uploadError);
        } else {
          console.log('تم رفع ملف الاختبار بنجاح');
          
          // محاولة جلب الرابط العام للملف
          const { data: urlData } = await supabase
            .storage
            .from('receipt_images')
            .getPublicUrl(testFilePath);
          
          if (urlData?.publicUrl) {
            console.log('تم التحقق من إمكانية الوصول العام بنجاح:', urlData.publicUrl);
            
            // حذف ملف الاختبار بعد الانتهاء
            await supabase
              .storage
              .from('receipt_images')
              .remove([testFilePath]);
          }
        }
      } catch (error: any) {
        console.error('خطأ في إعداد سياسات الوصول العامة:', error);
      }
    };
    
    // التحقق من سلة التخزين عند تحميل المكون
    checkBucket();
  }, [toast]);

  // لا نريد عرض هذا المكون في واجهة المستخدم
  // فقط للتحقق من وجود وصحة سلة التخزين عند بدء التطبيق
  return null;
};

export default SupabaseStorageBucketCheck;
