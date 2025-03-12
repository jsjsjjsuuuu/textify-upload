
import { createClient } from '@supabase/supabase-js';
import { ImageData } from '@/types/ImageData';

// إنشاء عميل Supabase
// ملاحظة: يجب استبدال هذه المتغيرات ببيانات Supabase الخاصة بك
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// تحويل بيانات الصورة إلى تنسيق يمكن تخزينه في قاعدة البيانات
export const convertImageToRecord = (image: ImageData) => {
  return {
    id: image.id,
    code: image.code || null,
    senderName: image.senderName || null,
    phoneNumber: image.phoneNumber || null,
    province: image.province || null,
    price: image.price || null,
    companyName: image.companyName || null,
    extractedText: image.extractedText || null,
    confidence: image.confidence || null,
    extractionMethod: image.extractionMethod || 'ocr',
    status: image.status || 'completed',
    created_at: new Date().toISOString(),
    user_id: supabase.auth.getUser().then(res => res.data.user?.id) || null,
  };
};

// حفظ البيانات المستخرجة في قاعدة البيانات
export const saveExtractedData = async (image: ImageData) => {
  try {
    const { data, error } = await supabase
      .from('extracted_data')
      .insert(convertImageToRecord(image))
      .select();
    
    if (error) throw error;
    
    console.log('تم حفظ البيانات بنجاح:', data);
    return { success: true, data };
  } catch (error) {
    console.error('خطأ في حفظ البيانات:', error);
    return { success: false, error };
  }
};

// جلب جميع البيانات المستخرجة للمستخدم الحالي
export const getExtractedData = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) throw new Error('المستخدم غير مسجل الدخول');
    
    const { data, error } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('خطأ في جلب البيانات:', error);
    return { success: false, error };
  }
};

// حذف بيانات مستخرجة
export const deleteExtractedData = async (id: string) => {
  try {
    const { error } = await supabase
      .from('extracted_data')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في حذف البيانات:', error);
    return { success: false, error };
  }
};
