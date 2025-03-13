import { createClient } from '@supabase/supabase-js';
import { ImageData } from '@/types/ImageData';
import { Company } from '@/types/Company';

// إنشاء عميل Supabase باستخدام المتغيرات البيئية
// أو استخدام المفاتيح المحددة مباشرة إذا لم تتوفر المتغيرات البيئية
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmqexqmogyvsct.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWV4cW1vZ3l2c3J0Z3ZzY3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzkxMTIsImV4cCI6MjA1NzMxNTExMn0.Rc8AIgx6-sWStsO1Xh9P5H91cu6hM5ogxGuthJs8Btk';

// تحقق من وجود متغيرات البيئة أو المفاتيح المباشرة
const hasSupabaseConfig = supabaseUrl && supabaseKey;

// إنشاء عميل Supabase فقط إذا كانت المفاتيح موجودة
let supabase: any;

if (hasSupabaseConfig) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("تم الاتصال بـ Supabase بنجاح");
  console.log("عنوان URL:", supabaseUrl); // سجل عنوان URL للتحقق
} else {
  console.warn("متغيرات بيئة Supabase غير متوفرة - سيتم تخزين البيانات محلياً فقط");
  // إنشاء نسخة وهمية من عميل Supabase
  supabase = {
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ error: null })
      })
    },
    from: () => ({
      select: () => ({
        order: () => ({ data: [], error: null }),
        eq: () => ({ data: null, error: null }),
        single: () => ({ data: null, error: null })
      }),
      insert: () => ({ error: null }),
      upsert: () => ({ error: null }),
      update: () => ({ error: null }),
      delete: () => ({ error: null })
    })
  };
}

// واجهة البيانات في قاعدة البيانات
export interface DbImageData {
  id: string;
  user_id?: string;
  company_id?: string; // إضافة معرف الشركة
  file_name: string;
  file_url: string;
  extracted_text: string;
  confidence?: number;
  code?: string;
  sender_name?: string;
  phone_number?: string;
  secondary_phone_number?: string;
  province?: string;
  price?: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  status: string;
  submitted: boolean;
  extraction_method?: string;
}

// واجهة بيانات الشركة في قاعدة البيانات
export interface DbCompany {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

// تحويل من ImageData إلى DbImageData
export const toDbFormat = (imageData: ImageData): Omit<DbImageData, 'created_at' | 'updated_at'> => {
  return {
    id: imageData.id,
    file_name: imageData.file.name,
    file_url: imageData.previewUrl,
    extracted_text: imageData.extractedText,
    confidence: imageData.confidence,
    code: imageData.code,
    sender_name: imageData.senderName,
    phone_number: imageData.phoneNumber,
    secondary_phone_number: imageData.secondaryPhoneNumber,
    province: imageData.province,
    price: imageData.price,
    company_name: imageData.companyName,
    status: imageData.status,
    submitted: !!imageData.submitted,
    extraction_method: imageData.extractionMethod,
    company_id: imageData.companyId,
  };
};

// تحويل من DbImageData إلى ImageData
export const fromDbFormat = (dbData: DbImageData, file: File): Partial<ImageData> => {
  return {
    id: dbData.id,
    companyId: dbData.company_id, // إضافة معرف الشركة
    file,
    previewUrl: dbData.file_url,
    extractedText: dbData.extracted_text,
    confidence: dbData.confidence,
    code: dbData.code,
    senderName: dbData.sender_name,
    phoneNumber: dbData.phone_number,
    secondaryPhoneNumber: dbData.secondary_phone_number,
    province: dbData.province,
    price: dbData.price,
    companyName: dbData.company_name,
    date: new Date(dbData.created_at),
    status: dbData.status as "processing" | "completed" | "error",
    submitted: dbData.submitted,
    extractionMethod: dbData.extraction_method as "ocr" | "gemini"
  };
};

// مخزن محلي بديل عند عدم توفر Supabase
interface LocalStorageDB {
  images: DbImageData[];
  companies: DbCompany[];
  counter: number;
}

const localStorageDB: LocalStorageDB = {
  images: [],
  companies: [],
  counter: 0
};

// وظائف التعامل مع الشركات
export const fetchCompanies = async (): Promise<{ success: boolean; data?: DbCompany[]; error?: string }> => {
  try {
    if (!hasSupabaseConfig) {
      // استرجاع محلي للشركات
      console.log("استرجاع الشركات من المخزن المحلي -", localStorageDB.companies.length, "شركة");
      return { success: true, data: localStorageDB.companies };
    }
    
    // استخدام Supabase لاسترجاع الشركات
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('خطأ في استرجاع الشركات:', error);
      return { success: false, error: error.message };
    }
    
    console.log('تم استرجاع الشركات بنجاح:', data?.length || 0, 'شركة');
    return { success: true, data };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};

export const saveCompany = async (company: Company): Promise<{ success: boolean; data?: DbCompany; error?: string }> => {
  try {
    const dbCompany: Omit<DbCompany, 'created_at' | 'updated_at'> = {
      id: company.id,
      name: company.name,
      logo_url: company.logoUrl
    };
    
    if (!hasSupabaseConfig) {
      // تخزين محلي للشركة
      const localCompany: DbCompany = {
        ...dbCompany,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorageDB.companies.push(localCompany);
      console.log("تم تخزين الشركة محلياً:", localCompany.id);
      return { success: true, data: localCompany };
    }
    
    // استخدام Supabase لتخزين الشركة
    const { data, error } = await supabase
      .from('companies')
      .upsert(dbCompany)
      .select()
      .single();
      
    if (error) {
      console.error('خطأ في حفظ الشركة:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};

// وظائف التعامل مع قاعدة البيانات مع دعم الوضع المحلي
export const saveImageData = async (imageData: ImageData): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!hasSupabaseConfig) {
      // تخزين محلي بدلاً من Supabase
      const localData: DbImageData = {
        ...toDbFormat(imageData),
        company_id: imageData.companyId, // إضافة معرف الشركة
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_url: imageData.previewUrl
      };
      
      localStorageDB.images.push(localData);
      console.log("تم تخزين الصورة محلياً:", localData.id);
      return { success: true };
    }
    
    // استخدام Supabase إذا كان متاحاً
    // رفع الملف إلى التخزين
    const fileExt = imageData.file.name.split('.').pop();
    const filePath = `images/${imageData.id}.${fileExt}`;
    
    // رفع الملف
    const { error: uploadError } = await supabase.storage
      .from('textify-uploads')
      .upload(filePath, imageData.file);
      
    if (uploadError) {
      console.error('خطأ في رفع الملف:', uploadError);
      return { success: false, error: uploadError.message };
    }
    
    // الحصول على URL العام للملف
    const { data: urlData } = await supabase.storage
      .from('textify-uploads')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    // تخزين بيانات الصورة في الجدول
    const dbData = {
      ...toDbFormat({
        ...imageData,
        previewUrl: publicUrl
      }),
      company_id: imageData.companyId // إضافة معرف الشركة
    };
    
    const { error: insertError } = await supabase
      .from('image_data')
      .upsert(dbData);
      
    if (insertError) {
      console.error('خطأ في تخزين البيانات:', insertError);
      return { success: false, error: insertError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};

export const updateImageData = async (id: string, updatedFields: Partial<ImageData>): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!hasSupabaseConfig) {
      // تحديث محلي بدلاً من Supabase
      const imageIndex = localStorageDB.images.findIndex(img => img.id === id);
      if (imageIndex !== -1) {
        const dbFields: Record<string, any> = {};
        
        if (updatedFields.code !== undefined) dbFields.code = updatedFields.code;
        if (updatedFields.senderName !== undefined) dbFields.sender_name = updatedFields.senderName;
        if (updatedFields.phoneNumber !== undefined) dbFields.phone_number = updatedFields.phoneNumber;
        if (updatedFields.secondaryPhoneNumber !== undefined) dbFields.secondary_phone_number = updatedFields.secondaryPhoneNumber;
        if (updatedFields.province !== undefined) dbFields.province = updatedFields.province;
        if (updatedFields.price !== undefined) dbFields.price = updatedFields.price;
        if (updatedFields.companyName !== undefined) dbFields.company_name = updatedFields.companyName;
        if (updatedFields.status !== undefined) dbFields.status = updatedFields.status;
        if (updatedFields.submitted !== undefined) dbFields.submitted = updatedFields.submitted;
        if (updatedFields.extractionMethod !== undefined) dbFields.extraction_method = updatedFields.extractionMethod;
        
        localStorageDB.images[imageIndex] = {
          ...localStorageDB.images[imageIndex],
          ...dbFields,
          updated_at: new Date().toISOString()
        };
        
        console.log("تم تحديث الصورة محلياً:", id);
      }
      return { success: true };
    }
    
    // استخدام Supabase إذا كان متاحاً
    // تحويل الحقول المحدثة إلى تنسيق قاعدة البيانات
    const dbFields: Record<string, any> = {};
    
    if (updatedFields.code !== undefined) dbFields.code = updatedFields.code;
    if (updatedFields.senderName !== undefined) dbFields.sender_name = updatedFields.senderName;
    if (updatedFields.phoneNumber !== undefined) dbFields.phone_number = updatedFields.phoneNumber;
    if (updatedFields.secondaryPhoneNumber !== undefined) dbFields.secondary_phone_number = updatedFields.secondaryPhoneNumber;
    if (updatedFields.province !== undefined) dbFields.province = updatedFields.province;
    if (updatedFields.price !== undefined) dbFields.price = updatedFields.price;
    if (updatedFields.companyName !== undefined) dbFields.company_name = updatedFields.companyName;
    if (updatedFields.status !== undefined) dbFields.status = updatedFields.status;
    if (updatedFields.submitted !== undefined) dbFields.submitted = updatedFields.submitted;
    if (updatedFields.extractionMethod !== undefined) dbFields.extraction_method = updatedFields.extractionMethod;
    
    // تحديث السجل في قاعدة البيانات
    const { error } = await supabase
      .from('image_data')
      .update(dbFields)
      .eq('id', id);
      
    if (error) {
      console.error('خطأ في تحديث البيانات:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};

export const deleteImageData = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!hasSupabaseConfig) {
      // حذف محلي بدلاً من Supabase
      const initialLength = localStorageDB.images.length;
      localStorageDB.images = localStorageDB.images.filter(img => img.id !== id);
      
      if (localStorageDB.images.length < initialLength) {
        console.log("تم حذف الصورة محلياً:", id);
      } else {
        console.warn("لم يتم العثور على الصورة للحذف:", id);
      }
      
      return { success: true };
    }
    
    // استخدام Supabase إذا كان متاحاً
    // الحصول على مسار الملف أولاً
    const { data, error: fetchError } = await supabase
      .from('image_data')
      .select('file_url')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('خطأ في استرجاع بيانات الملف:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // استخراج مسار الملف من URL
    const fileUrl = data?.file_url;
    if (fileUrl) {
      const filePath = fileUrl.split('/').pop();
      if (filePath) {
        // حذف الملف من التخزين
        const { error: deleteStorageError } = await supabase.storage
          .from('textify-uploads')
          .remove([`images/${filePath}`]);
        
        if (deleteStorageError) {
          console.error('خطأ في حذف الملف من التخزين:', deleteStorageError);
          // استمر في محاولة حذف السجل حتى لو فشل حذف الملف
        }
      }
    }
    
    // حذف السجل من الجدول
    const { error: deleteError } = await supabase
      .from('image_data')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      console.error('خطأ في حذف البيانات:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};

// تعديل وظيفة fetchAllImages لتصفية حسب الشركة
export const fetchAllImages = async (companyId?: string): Promise<{ success: boolean; data?: DbImageData[]; error?: string }> => {
  try {
    if (!hasSupabaseConfig) {
      // استرجاع محلي بدلاً من Supabase
      console.log("استرجاع الصور من المخزن المحلي -", localStorageDB.images.length, "صورة");
      
      // تصفية حسب الشركة إذا تم تحديد معرف الشركة
      const filteredImages = companyId 
        ? localStorageDB.images.filter(img => img.company_id === companyId)
        : localStorageDB.images;
        
      return { success: true, data: filteredImages };
    }
    
    // استخدام Supabase إذا كان متاحاً
    let query = supabase
      .from('image_data')
      .select('*')
      .order('created_at', { ascending: false });
      
    // تصفية حسب الشركة إذا تم تحديد معرف الشركة
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('خطأ في استرجاع البيانات:', error);
      return { success: false, error: error.message };
    }
    
    console.log('تم استرجاع البيانات بنجاح:', data?.length || 0, 'صورة');
    return { success: true, data }; // تصحيح هنا: إرجاع البيانات الفعلية بدلاً من مصفوفة فارغة
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};

export const submitImageToExternalApi = async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    if (!hasSupabaseConfig) {
      // تقديم محلي بدلاً من Supabase
      const imageIndex = localStorageDB.images.findIndex(img => img.id === id);
      
      if (imageIndex === -1) {
        return { success: false, error: 'لم يتم العثور على الصورة المطلوبة' };
      }
      
      // محاكاة إرسال البيانات إلى API خارجي مع تأخير
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // تحديث حالة التقديم
      localStorageDB.images[imageIndex].submitted = true;
      
      console.log("تم تقديم الصورة محلياً:", id);
      return { 
        success: true, 
        message: 'تم إرسال البيانات بنجاح (وضع محلي)'
      };
    }
    
    // استخدام Supabase إذا كان متاحاً
    // استرجاع بيانات الصورة
    const { data, error: fetchError } = await supabase
      .from('image_data')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('خطأ في استرجاع بيانات الصورة:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!data) {
      return { success: false, error: 'لم يتم العثور على الصورة المطلوبة' };
    }
    
    // محاكاة إرسال البيانات إلى API خارجي مع تأخير
    // في التطبيق الحقيقي، هنا سيتم الاتصال بالخدمة الخارجية
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // تحديث حالة التقديم
    const { error: updateError } = await supabase
      .from('image_data')
      .update({ submitted: true })
      .eq('id', id);
      
    if (updateError) {
      console.error('خطأ في تحديث حالة التقديم:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { 
      success: true, 
      message: 'تم إرسال البيانات بنجاح'
    };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};
