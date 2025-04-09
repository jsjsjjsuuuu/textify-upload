
import { supabase } from './client';

// استرجاع سجلات الصور للمستخدم المحدد
export async function getImageRecords(userId: string) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في استرجاع سجلات الصور:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('خطأ في استرجاع سجلات الصور:', error);
    throw error;
  }
}

// استرجاع سجل صورة واحد بواسطة المعرف
export async function getImageRecordById(id: string) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('خطأ في استرجاع سجل الصورة:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('خطأ في استرجاع سجل الصورة:', error);
    throw error;
  }
}

// استرجاع آخر سجلات الصور (مع حد أقصى)
export async function getRecentImageRecords(userId: string, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('خطأ في استرجاع آخر سجلات الصور:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('خطأ في استرجاع آخر سجلات الصور:', error);
    throw error;
  }
}
