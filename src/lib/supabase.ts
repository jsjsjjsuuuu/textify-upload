
import { createClient } from '@supabase/supabase-js';
import { ImageData } from '@/types/ImageData';

// تهيئة عميل Supabase باستخدام البيانات من متغيرات البيئة
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// نوع بيانات المستخدم من Supabase
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    role?: string;
  };
}

// تعريف كائن لتخزين البيانات المستخرجة
export interface ExtractedRecord {
  id?: string;
  user_id: string;
  image_name: string;
  image_url?: string;
  extracted_text: string;
  code?: string;
  sender_name?: string;
  phone_number?: string;
  province?: string;
  price?: string;
  company_name?: string;
  confidence?: number;
  created_at?: string;
  extraction_method?: string;
}

// دالة لتحويل بيانات الصورة إلى سجل للتخزين
export const imageDataToRecord = (imageData: ImageData, userId: string): ExtractedRecord => {
  return {
    user_id: userId,
    image_name: imageData.file.name,
    extracted_text: imageData.extractedText,
    code: imageData.code,
    sender_name: imageData.senderName,
    phone_number: imageData.phoneNumber,
    province: imageData.province,
    price: imageData.price,
    company_name: imageData.companyName,
    confidence: imageData.confidence,
    extraction_method: imageData.extractionMethod,
  };
};

// دالة لحفظ الصورة في تخزين Supabase
export const uploadImageToStorage = async (
  file: File,
  userId: string
): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file);

  if (error) {
    console.error('خطأ في تحميل الصورة:', error);
    return null;
  }

  // احصل على URL عام للصورة
  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

// دالة لحفظ السجل المستخرج في قاعدة البيانات
export const saveExtractedRecord = async (
  record: ExtractedRecord,
  file?: File
): Promise<{ success: boolean; id?: string; error?: any }> => {
  try {
    // إذا تم توفير ملف، قم بتحميله أولاً
    let imageUrl = null;
    if (file) {
      imageUrl = await uploadImageToStorage(file, record.user_id);
      if (imageUrl) {
        record.image_url = imageUrl;
      }
    }

    // حفظ السجل في جدول extracted_records
    const { data, error } = await supabase
      .from('extracted_records')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error('خطأ في حفظ السجل:', error);
      return { success: false, error };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('خطأ غير متوقع أثناء حفظ السجل:', error);
    return { success: false, error };
  }
};

// دالة لاسترجاع كافة السجلات لمستخدم معين
export const getExtractedRecords = async (
  userId: string
): Promise<ExtractedRecord[]> => {
  const { data, error } = await supabase
    .from('extracted_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('خطأ في استرجاع السجلات:', error);
    return [];
  }

  return data || [];
};

// دالة لاسترجاع سجل واحد حسب المعرف
export const getExtractedRecordById = async (
  id: string
): Promise<ExtractedRecord | null> => {
  const { data, error } = await supabase
    .from('extracted_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('خطأ في استرجاع السجل:', error);
    return null;
  }

  return data;
};
