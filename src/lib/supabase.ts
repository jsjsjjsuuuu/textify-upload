import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// استخدام قيم افتراضية إذا لم تكن متوفرة من متغيرات البيئة
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'your-anon-key';

// تحقق من القيم قبل إنشاء العميل
if (!supabaseUrl || supabaseUrl === 'https://example.supabase.co') {
  console.warn('⚠️ تم استخدام عنوان URL افتراضي لـ Supabase. يرجى تعيين VITE_SUPABASE_URL في ملف .env');
}

if (!supabaseKey || supabaseKey === 'your-anon-key') {
  console.warn('⚠️ تم استخدام مفتاح افتراضي لـ Supabase. يرجى تعيين VITE_SUPABASE_KEY في ملف .env');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// نوع المستخدم في Supabase
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    [key: string]: any;
  };
  app_metadata?: {
    role?: string;
    [key: string]: any;
  };
}

// تحويل بيانات الصورة إلى تنسيق يمكن تخزينه في قاعدة البيانات
import { ImageData } from "@/types/ImageData";

export const imageDataToRecord = (image: ImageData) => {
  return {
    id: image.id,
    code: image.code || null,
    sender_name: image.senderName || null,
    phone_number: image.phoneNumber || null,
    province: image.province || null,
    price: image.price || null,
    company_name: image.companyName || null,
    extracted_text: image.extractedText || null,
    confidence: image.confidence || null,
    extraction_method: image.extractionMethod || 'ocr',
    status: image.status || 'completed',
    created_at: new Date().toISOString(),
  };
};

// حفظ البيانات المستخرجة في قاعدة البيانات
export const saveExtractedRecord = async (image: ImageData) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      return { success: false, error: "المستخدم غير مسجل الدخول" };
    }
    
    const record = {
      ...imageDataToRecord(image),
      user_id: userId
    };
    
    const { data, error } = await supabase
      .from('extracted_data')
      .insert(record)
      .select();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('خطأ في حفظ البيانات:', error);
    return { success: false, error };
  }
};

// دالة جلب البيانات المستخرجة
export const getExtractedData = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: "المستخدم غير مسجل الدخول" };
    }

    const { data, error } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('خطأ في جلب البيانات:', error);
    return { success: false, error };
  }
};

// دالة حذف السجل
export const deleteExtractedData = async (id: string) => {
  try {
    const { error } = await supabase
      .from('extracted_data')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('خطأ في حذف السجل:', error);
    return { success: false, error };
  }
};
