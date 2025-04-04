
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_RECORDS_PER_USER = 100; // تعديل الحد الأقصى لعدد السجلات لكل مستخدم إلى 100

// متغير لتتبع حالة التنظيف
let cleanupInProgress = false;

export const useDbCleanup = () => {
  const { toast } = useToast();

  // وظيفة لتنظيف السجلات القديمة والاحتفاظ فقط بأحدث MAX_RECORDS_PER_USER سجل
  const cleanupOldRecords = useCallback(async (userId: string) => {
    if (cleanupInProgress) return;
    
    cleanupInProgress = true;
    try {
      console.log(`بدء عملية تنظيف سجلات المستخدم: ${userId}`);
      
      // 1. الحصول على عدد السجلات الحالية للمستخدم
      const { count, error: countError } = await supabase
        .from('images')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      
      if (countError) {
        console.error("خطأ في حساب عدد السجلات:", countError);
        return;
      }
      
      // تحويل count إلى رقم (لأنه يمكن أن يكون null)
      const recordCount = count || 0;
      
      console.log(`عدد سجلات المستخدم: ${recordCount}، الحد الأقصى: ${MAX_RECORDS_PER_USER}`);
      
      // 2. إذا كان عدد السجلات أكبر من الحد الأقصى، قم بحذف السجلات القديمة
      if (recordCount > MAX_RECORDS_PER_USER) {
        // أ. الحصول على قائمة بالسجلات مرتبة من الأقدم إلى الأحدث
        const { data: oldestRecords, error: fetchError } = await supabase
          .from('images')
          .select('id, storage_path')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(recordCount - MAX_RECORDS_PER_USER);
        
        if (fetchError) {
          console.error("خطأ في جلب السجلات القديمة:", fetchError);
          return;
        }
        
        console.log(`تم العثور على ${oldestRecords?.length || 0} سجل قديم للحذف`);
        
        if (!oldestRecords || oldestRecords.length === 0) {
          return;
        }
        
        // ب. استخراج معرفات السجلات للحذف
        const recordIdsToDelete = oldestRecords.map(record => record.id);
        
        // د. حذف السجلات من قاعدة البيانات
        const { error: deleteError } = await supabase
          .from('images')
          .delete()
          .in('id', recordIdsToDelete);
        
        if (deleteError) {
          console.error("خطأ في حذف السجلات القديمة:", deleteError);
          return;
        }
        
        console.log(`تم حذف ${recordIdsToDelete.length} سجل قديم بنجاح`);
        
        // هـ. إظهار إشعار للمستخدم
        toast({
          title: "تنظيف البيانات",
          description: `تم حذف ${recordIdsToDelete.length} سجل قديم للحفاظ على أداء النظام`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("خطأ في عملية تنظيف السجلات القديمة:", error);
    } finally {
      // إعادة تعيين متغير حالة التنظيف بعد فترة قصيرة
      setTimeout(() => {
        cleanupInProgress = false;
      }, 10000); // انتظار 10 ثوانٍ قبل السماح بإجراء عملية تنظيف أخرى
    }
  }, [toast]);

  // وظيفة لتنفيذ عملية التنظيف الآن بشكل يدوي
  const runCleanupNow = async (userId: string) => {
    console.log("بدء تنفيذ عملية التنظيف يدوياً للمستخدم:", userId);
    
    try {
      // إظهار إشعار بدء التنظيف
      toast({
        title: "جاري التنظيف",
        description: "بدء عملية تنظيف الملفات والسجلات القديمة...",
      });
      
      // تنفيذ عملية التنظيف
      await cleanupOldRecords(userId);
      
      // التحقق من النتائج بعد التنظيف
      const { count, error: countError } = await supabase
        .from('images')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      
      if (countError) {
        throw new Error(`خطأ أثناء التحقق من نتائج التنظيف: ${countError.message}`);
      }
      
      // إظهار إشعار اكتمال التنظيف
      toast({
        title: "اكتمل التنظيف",
        description: `تم تنظيف الملفات والسجلات. عدد السجلات الحالي: ${count || 0}`,
      });
      
      return true;
    } catch (error: any) {
      console.error("خطأ أثناء تنفيذ عملية التنظيف يدوياً:", error);
      
      toast({
        title: "خطأ في التنظيف",
        description: `حدث خطأ أثناء تنظيف الملفات: ${error.message}`,
        variant: "destructive",
      });
      
      return false;
    }
  };

  return {
    cleanupOldRecords,
    runCleanupNow
  };
};
