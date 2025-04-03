
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
    // التحقق من وجود السلة
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket('receipt_images');
    
    if (bucketError && bucketError.message.includes('does not exist')) {
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
      
      console.log('تم إنشاء سلة التخزين receipt_images بنجاح:', createData);
      return true;
    } else if (bucketData) {
      console.log('سلة التخزين receipt_images موجودة بالفعل');
      
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
      }
      
      return true;
    } else if (bucketError) {
      console.error('خطأ في التحقق من سلة التخزين receipt_images:', bucketError);
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('خطأ غير متوقع أثناء التحقق من سلة التخزين:', error);
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
