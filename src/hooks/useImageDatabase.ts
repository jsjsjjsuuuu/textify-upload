
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// مدة انتهاء صلاحية الصور القديمة (30 يوم)
const OLD_IMAGE_EXPIRY_DAYS = 30;

export const useImageDatabase = (updateImage: (id: string, update: Partial<ImageData>) => void) => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const { toast } = useToast();

  // تحميل صور المستخدم من قاعدة البيانات
  const loadUserImages = async (userId: string, callback?: (images: ImageData[]) => void) => {
    try {
      setIsLoadingUserImages(true);
      console.log("جاري تحميل صور المستخدم:", userId);

      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("خطأ في تحميل الصور:", error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`تم تحميل ${data.length} صورة من قاعدة البيانات`);
        
        // تحويل البيانات المخزنة إلى كائنات ImageData
        const convertedImages: ImageData[] = data.map((imageData: any, index) => {
          // إنشاء كائن File مؤقت - لا يمكن إعادة إنشاء الملف الأصلي
          const dummyFile = new File([], imageData.file_name || "image.jpg", { 
            type: "image/jpeg" 
          });
          
          return {
            id: imageData.id,
            file: dummyFile,
            previewUrl: imageData.preview_url,
            extractedText: imageData.extracted_text || "",
            code: imageData.code || "",
            senderName: imageData.sender_name || "",
            phoneNumber: imageData.phone_number || "",
            province: imageData.province || "",
            price: imageData.price || "",
            companyName: imageData.company_name || "",
            date: new Date(imageData.created_at),
            status: imageData.status || "completed",
            submitted: imageData.submitted || false,
            user_id: imageData.user_id,
            storage_path: imageData.storage_path,
            batch_id: imageData.batch_id,
            // إضافة طابع زمني استنادًا إلى وقت الإنشاء
            added_at: new Date(imageData.created_at).getTime(),
            // رقم ترتيبي مؤقت
            number: data.length - index
          };
        });
        
        // تنقية الصور من التكرارات قبل تعيينها
        const uniqueImagesMap = new Map<string, ImageData>();
        
        convertedImages.forEach(img => {
          const key = `${img.file.name}_${img.user_id || ''}_${img.batch_id || ''}`;
          
          if (!uniqueImagesMap.has(key) || 
              (img.added_at && uniqueImagesMap.get(key)?.added_at && img.added_at > uniqueImagesMap.get(key)!.added_at!)) {
            uniqueImagesMap.set(key, img);
          }
        });
        
        const uniqueImages = Array.from(uniqueImagesMap.values());
        console.log(`تم إزالة ${convertedImages.length - uniqueImages.length} صورة مكررة من قاعدة البيانات`);
        
        // استدعاء الدالة الرجعية إذا كانت موجودة وإلا استخدام دالة setAllImages
        if (callback) {
          callback(uniqueImages);
        }
      } else {
        console.log("لا توجد صور مخزنة للمستخدم");
        // استدعاء الدالة الرجعية مع مصفوفة فارغة إذا كانت موجودة
        if (callback) {
          callback([]);
        }
      }
    } catch (error) {
      console.error("خطأ في تحميل الصور:", error);
      toast({
        title: "خطأ في التحميل",
        description: "تعذر تحميل الصور من قاعدة البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUserImages(false);
    }
  };
  
  // حفظ صورة في قاعدة البيانات وStorage
  const saveImageToDatabase = async (image: ImageData) => {
    try {
      console.log("جاري حفظ الصورة في قاعدة البيانات:", image.id);
      
      // التحقق من وجود previewUrl وملف صالح
      if (!image.previewUrl || !image.file) {
        console.error("بيانات الصورة غير كاملة، لا يمكن الحفظ");
        return null;
      }
      
      // التحقق مما إذا كان previewUrl هو URL عادي أو بيانات Base64
      let storageUrl = image.previewUrl;
      
      // إذا كان previewUrl يبدأ بـ "data:"، فهذا يعني أنه بيانات مشفرة بـ Base64
      // نحتاج إلى تحميله أولاً إلى التخزين
      if (image.previewUrl.startsWith('data:')) {
        console.log("تحميل الصورة إلى التخزين...");
        
        // تحويل البيانات المشفرة بـ Base64 إلى Blob
        const res = await fetch(image.previewUrl);
        const blob = await res.blob();
        
        // إنشاء مسار تخزين فريد للمستخدم
        const storagePath = `images/${image.user_id || 'anonymous'}/${image.id}`;
        
        // تحميل الملف إلى التخزين
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(storagePath, blob, {
            contentType: 'image/jpeg', // أو استخدم image.file.type
            upsert: true
          });
        
        if (uploadError) {
          console.error("خطأ في تحميل الصورة إلى التخزين:", uploadError);
          throw uploadError;
        }
        
        // الحصول على URL العام للصورة
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(storagePath);
        
        storageUrl = publicUrlData.publicUrl;
        
        console.log("تم تحميل الصورة إلى التخزين:", storageUrl);
        
        // تحديث مسار التخزين في كائن الصورة
        image.storage_path = storagePath;
      }
      
      // حفظ بيانات الصورة في قاعدة البيانات
      const { data, error } = await supabase
        .from('images')
        .upsert([
          {
            id: image.id,
            file_name: image.file.name,
            preview_url: storageUrl,
            extracted_text: image.extractedText,
            code: image.code,
            sender_name: image.senderName,
            phone_number: image.phoneNumber,
            province: image.province,
            price: image.price,
            company_name: image.companyName,
            created_at: image.date.toISOString(),
            status: image.status,
            submitted: image.submitted || false,
            user_id: image.user_id,
            storage_path: image.storage_path,
            batch_id: image.batch_id
          }
        ], { onConflict: 'id' });
      
      if (error) {
        console.error("خطأ في حفظ الصورة:", error);
        throw error;
      }
      
      console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
      return data;
    } catch (error) {
      console.error("خطأ في حفظ الصورة:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "تعذر حفظ الصورة في قاعدة البيانات",
        variant: "destructive"
      });
      return null;
    }
  };

  // إرسال البيانات إلى API وحفظها في قاعدة البيانات
  const handleSubmitToApi = async (id: string, image: ImageData, userId?: string) => {
    try {
      console.log(`محاولة إرسال البيانات إلى API للصورة: ${id}`);

      // حفظ الصورة في قاعدة البيانات وفي التخزين
      await saveImageToDatabase(image);
      
      // تحديث حالة الإرسال في قاعدة البيانات
      const { error: updateError } = await supabase
        .from('images')
        .update({ submitted: true })
        .eq('id', id);

      if (updateError) {
        console.error("خطأ في تحديث حالة الإرسال:", updateError);
        throw updateError;
      }
      
      console.log(`تم تحديث حالة الإرسال للصورة: ${id}`);
      
      // تحديث كائن الصورة محليًا
      updateImage(id, { 
        submitted: true,
        // تحديث previewUrl إذا تم تغييره أثناء الحفظ في التخزين
        previewUrl: image.previewUrl
      });
      
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال البيانات وحفظ الصورة بنجاح",
      });
      
      return true;
    } catch (error) {
      console.error("خطأ في إرسال البيانات إلى API:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "تعذر إرسال البيانات إلى الخادم",
        variant: "destructive"
      });
      return false;
    }
  };

  // حذف صورة من قاعدة البيانات
  const deleteImageFromDatabase = async (id: string) => {
    try {
      console.log("جاري حذف الصورة من قاعدة البيانات:", id);

      // الحصول على بيانات الصورة قبل الحذف لمعرفة مسار التخزين
      const { data: imageData, error: fetchError } = await supabase
        .from('images')
        .select('storage_path')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error("خطأ في جلب بيانات الصورة قبل الحذف:", fetchError);
      }

      // حذف الملف من التخزين إذا كان له مسار تخزين
      if (imageData && imageData.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('images')
          .remove([imageData.storage_path]);

        if (storageError) {
          console.error("خطأ في حذف الصورة من التخزين:", storageError);
        } else {
          console.log("تم حذف الصورة من التخزين:", imageData.storage_path);
        }
      }

      // حذف البيانات من جدول الصور
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("خطأ في حذف الصورة من قاعدة البيانات:", error);
        throw error;
      }

      console.log("تم حذف الصورة بنجاح من قاعدة البيانات:", id);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الصورة بنجاح",
      });
      
      return true;
    } catch (error) {
      console.error("خطأ في حذف الصورة:", error);
      toast({
        title: "خطأ في الحذف",
        description: "تعذر حذف الصورة من قاعدة البيانات",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // تنظيف السجلات القديمة في قاعدة البيانات
  const cleanupOldRecords = async (userId: string) => {
    try {
      // حساب التاريخ قبل عدد محدد من الأيام
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - OLD_IMAGE_EXPIRY_DAYS);
      const cutoffString = cutoffDate.toISOString();
      
      console.log(`تنظيف السجلات القديمة قبل ${cutoffString} للمستخدم ${userId}`);
      
      // استعلام عن عدد السجلات التي سيتم حذفها
      const { count } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('created_at', cutoffString);
      
      if (count && count > 0) {
        console.log(`سيتم حذف ${count} سجل قديم`);
        
        // حذف السجلات القديمة
        const { error } = await supabase
          .from('images')
          .delete()
          .eq('user_id', userId)
          .lt('created_at', cutoffString);
        
        if (error) {
          console.error("خطأ في حذف السجلات القديمة:", error);
        } else {
          console.log(`تم حذف ${count} سجل قديم بنجاح`);
        }
      } else {
        console.log("لا توجد سجلات قديمة للحذف");
      }
    } catch (error) {
      console.error("خطأ في تنظيف السجلات القديمة:", error);
    }
  };
  
  // وظيفة تنفيذ التنظيف الآن
  const runCleanupNow = async (userId: string) => {
    try {
      toast({
        title: "جاري التنظيف",
        description: "جاري تنظيف السجلات القديمة...",
      });
      
      await cleanupOldRecords(userId);
      
      toast({
        title: "اكتمل التنظيف",
        description: "تم تنظيف السجلات القديمة بنجاح",
      });
    } catch (error) {
      console.error("خطأ في تنفيذ التنظيف:", error);
      toast({
        title: "خطأ في التنظيف",
        description: "تعذر تنظيف السجلات القديمة",
        variant: "destructive"
      });
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
