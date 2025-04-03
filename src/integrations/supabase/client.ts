
import { createClient } from '@supabase/supabase-js';

// التحقق من وجود متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// التحقق من القيم قبل إنشاء العميل
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('متغيرات البيئة الخاصة بـ Supabase غير محددة', {
    supabaseUrl: Boolean(supabaseUrl),
    supabaseAnonKey: Boolean(supabaseAnonKey)
  });
  
  throw new Error('VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY مطلوبة. الرجاء التأكد من وجود ملف .env أو .env.local يحتوي على هذه المتغيرات.');
}

// إنشاء مثيل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    fetch: fetch
  }
});

// وظيفة مساعدة للتحقق من وجود سلة التخزين receipt_images
export const ensureStorageBucket = async () => {
  try {
    console.log('التحقق من وجود وإعدادات سلة التخزين receipt_images...');
    
    // التحقق من وجود السلة
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('receipt_images');
    
    if (bucketError) {
      // إذا كان الخطأ يشير إلى عدم وجود السلة
      if (bucketError.message.includes('does not exist')) {
        console.log('سلة التخزين receipt_images غير موجودة، سيتم إنشاؤها...');
        
        // إنشاء سلة جديدة
        const { data: createData, error: createError } = await supabase
          .storage
          .createBucket('receipt_images', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
          });
        
        if (createError) {
          console.error('فشل إنشاء سلة التخزين receipt_images:', createError);
          return false;
        }
        
        console.log('تم إنشاء سلة التخزين receipt_images بنجاح');
        
        // التحقق من الوصول العام من خلال اختبار بسيط
        await testPublicAccess();
        
        return true;
      } else {
        console.error('خطأ في التحقق من سلة التخزين receipt_images:', bucketError);
        return false;
      }
    } 
    
    // إذا كانت السلة موجودة بالفعل، تأكد من أنها عامة
    if (bucketData) {
      console.log('سلة التخزين receipt_images موجودة:', bucketData);
      
      // التأكد من أن السلة عامة
      if (!bucketData.public) {
        console.log('تحديث سلة التخزين receipt_images لتكون عامة...');
        const { error: updateError } = await supabase
          .storage
          .updateBucket('receipt_images', { public: true });
        
        if (updateError) {
          console.error('فشل تحديث سلة التخزين لتكون عامة:', updateError);
          return false;
        }
        
        console.log('تم تحديث سلة التخزين لتكون عامة بنجاح');
      }
      
      // التحقق من الوصول العام من خلال اختبار بسيط
      await testPublicAccess();
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('خطأ غير متوقع أثناء التحقق من سلة التخزين:', error);
    return false;
  }
};

// وظيفة لاختبار الوصول العام للسلة
const testPublicAccess = async () => {
  try {
    // إنشاء ملف اختبار مؤقت
    const testContent = new Blob(['test content'], { type: 'text/plain' });
    const testFilePath = `test_${Date.now()}.txt`;
    
    console.log('رفع ملف اختبار للتحقق من إعدادات الوصول...');
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('receipt_images')
      .upload(testFilePath, testContent);
    
    if (uploadError) {
      console.error('فشل رفع ملف الاختبار:', uploadError);
      return false;
    }
    
    // الحصول على الرابط العام
    const { data: publicUrlData } = await supabase
      .storage
      .from('receipt_images')
      .getPublicUrl(testFilePath);
    
    if (publicUrlData?.publicUrl) {
      console.log('تم التحقق من إمكانية الوصول العام بنجاح:', publicUrlData.publicUrl);
      
      // محاولة جلب الملف للتأكد من إمكانية الوصول العام
      try {
        const response = await fetch(publicUrlData.publicUrl);
        const isPublicAccessible = response.ok;
        console.log('نتيجة اختبار الوصول العام:', isPublicAccessible ? 'ناجح' : 'فاشل');
      } catch (fetchError) {
        console.error('فشل اختبار الوصول العام:', fetchError);
      }
      
      // حذف ملف الاختبار
      await supabase
        .storage
        .from('receipt_images')
        .remove([testFilePath]);
      
      console.log('تم حذف ملف الاختبار بنجاح');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('فشل اختبار الوصول العام:', error);
    return false;
  }
};

// وظيفة مساعدة للحصول على عنوان URL العام للصورة
export const getPublicUrl = (bucket: string, path: string): string | null => {
  if (!path) return null;
  
  try {
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data?.publicUrl || null;
  } catch (error) {
    console.error('خطأ في الحصول على عنوان URL العام:', error);
    return null;
  }
};
