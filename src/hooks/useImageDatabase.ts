
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { ImageData } from '@/types/ImageData';
import { compressAndGenerateBase64 } from '@/utils/imageCompression';

// حد أقصى لعدد الأيام التي سيتم الاحتفاظ بسجلات الصور فيها
const MAX_RECORD_AGE_DAYS = 30;

export const useImageDatabase = (updateImageCallback?: (id: string, data: Partial<ImageData>) => void) => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const { toast } = useToast();
  
  const loadUserImages = async (userId: string, callback?: (images: ImageData[]) => void) => {
    if (!userId) return [];
    
    setIsLoadingUserImages(true);
    try {
      console.log("جاري تحميل صور المستخدم:", userId);
      
      // استعلام قاعدة البيانات
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // تحويل البيانات من البيانات الخام إلى كائنات ImageData
      const images: ImageData[] = data.map((row: any) => ({
        id: row.id,
        file: null, // لا يمكن تخزين الملف نفسه في قاعدة البيانات
        previewUrl: row.preview_url,
        extractedText: row.extracted_text,
        code: row.code,
        senderName: row.sender_name,
        phoneNumber: row.phone_number,
        province: row.province,
        price: row.price,
        companyName: row.company_name,
        date: new Date(row.created_at), // استخدام تاريخ الإنشاء كتاريخ الصورة
        status: row.status || 'completed',
        submitted: row.submitted,
        batch_id: row.batch_id,
        storage_path: row.storage_path,
        added_at: row.created_at ? new Date(row.created_at).getTime().toString() : new Date().getTime().toString(),
        number: (data.length - data.findIndex((d: any) => d.id === row.id)), // ترتيب الصور تنازليًا
        userId: userId // تأكد من تعيين معرف المستخدم بشكل صحيح
      }));

      if (callback) {
        callback(images);
      }
      
      console.log(`تم تحميل ${images.length} صورة بنجاح للمستخدم:`, userId);
      return images;
    } catch (err) {
      console.error("Error loading images:", err);
      toast({
        title: "خطأ أثناء تحميل الصور",
        description: "حدث خطأ أثناء محاولة جلب الصور من قاعدة البيانات"
      });
      return [];
    } finally {
      setIsLoadingUserImages(false);
    }
  };

  // حفظ صورة معالجة إلى قاعدة البيانات
  const saveImageToDatabase = async (image: ImageData) => {
    if (!image || !image.id) {
      console.error("بيانات الصورة غير صالحة");
      return false;
    }

    try {
      console.log("حفظ صورة إلى قاعدة البيانات:", image.id);
      
      // تحويل الصورة إلى base64 إذا كانت موجودة
      let previewUrl = image.previewUrl;
      if (image.file && !previewUrl) {
        previewUrl = await compressAndGenerateBase64(image.file, 800, 'medium');
      }
      
      // إعداد البيانات للإدراج
      const imageData = {
        id: image.id,
        user_id: image.userId,
        status: image.status || 'completed',
        extracted_text: image.extractedText || '',
        storage_path: image.storage_path || '',
        preview_url: previewUrl || '',
        batch_id: image.batch_id || 'default',
        code: image.code || '',
        sender_name: image.senderName || '',
        phone_number: image.phoneNumber || '',
        province: image.province || '',
        price: image.price || '',
        company_name: image.companyName || '',
        submitted: image.submitted || false,
        file_name: image.fileName || (image.file ? image.file.name : 'unknown')
      };
      
      // التحقق من وجود الصورة في قاعدة البيانات
      const { data: existingData } = await supabase
        .from('images')
        .select('id')
        .eq('id', image.id)
        .single();
      
      let result;
      if (existingData) {
        // تحديث الصورة الموجودة
        const { data, error } = await supabase
          .from('images')
          .update(imageData)
          .eq('id', image.id)
          .select();
        
        if (error) throw error;
        result = data;
        console.log("تم تحديث الصورة في قاعدة البيانات:", image.id);
      } else {
        // إنشاء صورة جديدة
        const { data, error } = await supabase
          .from('images')
          .insert(imageData)
          .select();
        
        if (error) throw error;
        result = data;
        console.log("تم إنشاء صورة جديدة في قاعدة البيانات:", image.id);
      }
      
      return true;
    } catch (error) {
      console.error("Error saving image to database:", error);
      toast({
        title: "خطأ في حفظ الصورة",
        description: "حدث خطأ أثناء محاولة حفظ الصورة في قاعدة البيانات",
        variant: "destructive"
      });
      return false;
    }
  };

  // إرسال البيانات إلى API
  const handleSubmitToApi = async (id: string, image?: ImageData, userId?: string) => {
    if (!image) {
      console.error("لا توجد بيانات صورة للإرسال");
      return false;
    }
    
    try {
      console.log("جاري إرسال البيانات للصورة:", id);
      
      // تحديث حقل submitted في قاعدة البيانات
      const { data: updateData, error: updateError } = await supabase
        .from('images')
        .update({ 
          submitted: true,
          user_id: userId || image.userId,
          code: image.code,
          sender_name: image.senderName,
          phone_number: image.phoneNumber,
          province: image.province,
          price: image.price,
          company_name: image.companyName
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // تحديث الصورة في الحالة المحلية إذا تم توفير وظيفة التحديث
      if (updateImageCallback) {
        updateImageCallback(id, { submitted: true });
      }
      
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال بيانات الصورة وحفظها بنجاح"
      });
      
      return true;
    } catch (error) {
      console.error("Error submitting image data:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء محاولة إرسال بيانات الصورة",
        variant: "destructive"
      });
      return false;
    }
  };

  // حذف صورة من قاعدة البيانات
  const deleteImageFromDatabase = async (id: string) => {
    try {
      console.log("حذف صورة من قاعدة البيانات:", id);
      
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الصورة بنجاح"
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف الصورة",
        variant: "destructive"
      });
      return false;
    }
  };

  // تنظيف السجلات القديمة
  const cleanupOldRecords = async (userId: string) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_RECORD_AGE_DAYS);
    
    try {
      console.log(`تنظيف السجلات الأقدم من ${MAX_RECORD_AGE_DAYS} يوم للمستخدم:`, userId);
      
      const { error, count } = await supabase
        .from('images')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString())
        .select('count');
      
      if (error) throw error;
      
      console.log(`تم حذف ${count} سجل قديم`);
    } catch (error) {
      console.error("Error cleaning up old records:", error);
    }
  };

  // تنظيف السجلات القديمة على الفور بناءً على طلب المستخدم
  const runCleanupNow = async (userId: string) => {
    try {
      await cleanupOldRecords(userId);
      toast({
        title: "تم التنظيف",
        description: "تم تنظيف السجلات القديمة بنجاح"
      });
      return true;
    } catch (error) {
      console.error("Error in manual cleanup:", error);
      toast({
        title: "خطأ في التنظيف",
        description: "حدث خطأ أثناء محاولة تنظيف السجلات القديمة",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    isLoadingUserImages,
    loadUserImages,
    saveImageToDatabase,
    handleSubmitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  };
};
