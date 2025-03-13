
import { createClient } from '@supabase/supabase-js';
import { ImageData } from '@/types/ImageData';

// إنشاء عميل Supabase باستخدام المتغيرات البيئية
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('متغيرات بيئة Supabase غير متوفرة');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// واجهة البيانات في قاعدة البيانات
export interface DbImageData {
  id: string;
  user_id?: string;
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
  company_name?: string;
  created_at: string;
  updated_at: string;
  status: string;
  submitted: boolean;
  extraction_method?: string;
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
    extraction_method: imageData.extractionMethod
  };
};

// تحويل من DbImageData إلى ImageData
export const fromDbFormat = (dbData: DbImageData, file: File): Partial<ImageData> => {
  return {
    id: dbData.id,
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

// وظائف التعامل مع قاعدة البيانات
export const saveImageData = async (imageData: ImageData): Promise<{ success: boolean; error?: string }> => {
  try {
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
    const dbData = toDbFormat({
      ...imageData,
      previewUrl: publicUrl
    });
    
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

export const fetchAllImages = async (): Promise<{ success: boolean; data?: DbImageData[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('image_data')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('خطأ في استرجاع البيانات:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return { success: false, error: String(error) };
  }
};

export const submitImageToExternalApi = async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
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
