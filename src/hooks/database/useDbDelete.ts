
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDbDelete = () => {
  // وظيفة لحذف سجل الصورة من قاعدة البيانات
  const deleteImageFromDatabase = async (imageId: string) => {
    console.log("جاري حذف السجل من قاعدة البيانات:", imageId);
    
    try {
      // التحقق أولاً مما إذا كان السجل موجود في قاعدة البيانات
      const { data: existingImage } = await supabase
        .from('images')
        .select('id, storage_path')
        .eq('id', imageId)
        .maybeSingle();
      
      if (!existingImage) {
        console.log("السجل غير موجود في قاعدة البيانات:", imageId);
        return true; // يعتبر العملية ناجحة لأن السجل غير موجود أصلاً
      }
      
      // حذف السجل من قاعدة البيانات
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);
      
      if (error) {
        console.error("خطأ في حذف السجل من قاعدة البيانات:", error);
        throw error;
      }
      
      console.log("تم حذف السجل بنجاح من قاعدة البيانات:", imageId);
      return true;
      
    } catch (error: any) {
      console.error("خطأ أثناء محاولة حذف السجل:", error);
      throw error;
    }
  };

  return {
    deleteImageFromDatabase
  };
};
