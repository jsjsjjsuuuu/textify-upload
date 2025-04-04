
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useCallback } from "react";

const MAX_RECORDS_PER_USER = 100; // تعديل الحد الأقصى لعدد السجلات لكل مستخدم إلى 100

// متغير لتتبع حالة التنظيف
let cleanupInProgress = false;

export const useImageDatabase = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const { toast } = useToast();
  
  // استخدام مرجع لتخزين طلبات قاعدة البيانات الأخيرة لتجنب الاستدعاءات المتكررة
  const lastDbRequests = useRef<{[key: string]: {time: number, promise: Promise<any>}}>({});

  // وظيفة مساعدة لتخزين مؤقت لطلبات قاعدة البيانات المتكررة
  const cacheDbRequest = useCallback((key: string, requestFn: () => Promise<any>, ttlMs = 5000): Promise<any> => {
    const now = Date.now();
    const cachedRequest = lastDbRequests.current[key];
    
    if (cachedRequest && (now - cachedRequest.time < ttlMs)) {
      return cachedRequest.promise;
    }
    
    const promise = requestFn();
    lastDbRequests.current[key] = { time: now, promise };
    return promise;
  }, []);

  // وظيفة لحفظ بيانات الصورة في Supabase
  const saveImageToDatabase = async (image: ImageData, userId: string | undefined) => {
    if (!userId) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن حفظ البيانات");
      return null;
    }

    console.log("جاري حفظ البيانات في قاعدة البيانات...", image);

    try {
      // التحقق مما إذا كانت الصورة موجودة بالفعل
      const { data: existingImage } = await supabase
        .from('images')
        .select('id')
        .eq('id', image.id)
        .maybeSingle();

      if (existingImage) {
        console.log("الصورة موجودة بالفعل، جاري التحديث:", existingImage.id);
        
        const { data: updatedData, error: updateError } = await supabase
          .from('images')
          .update({
            preview_url: image.previewUrl,
            extracted_text: image.extractedText,
            company_name: image.companyName || "",
            sender_name: image.senderName || "",
            phone_number: image.phoneNumber || "",
            code: image.code || "",
            price: image.price || "",
            province: image.province || "",
            status: image.status,
            submitted: true,
            batch_id: image.batch_id || "default",
            storage_path: image.storage_path || null // تحديث مسار التخزين
          })
          .eq('id', existingImage.id)
          .select();

        if (updateError) {
          console.error("خطأ في تحديث البيانات:", updateError);
          throw updateError;
        }

        console.log("تم تحديث البيانات بنجاح:", updatedData?.[0]);
        
        // هنا نقوم بتحديث الصورة في الواجهة بالبيانات المحدثة
        if (updatedData && updatedData[0]) {
          updateImage(image.id, {
            extractedText: updatedData[0].extracted_text,
            companyName: updatedData[0].company_name,
            senderName: updatedData[0].sender_name,
            phoneNumber: updatedData[0].phone_number,
            code: updatedData[0].code,
            price: updatedData[0].price,
            province: updatedData[0].province,
            status: updatedData[0].status as "processing" | "pending" | "completed" | "error",
            submitted: true
          });
        }
        
        return updatedData?.[0];
      }

      // إذا لم تكن الصورة موجودة، قم بإدراجها
      const { data, error } = await supabase
        .from('images')
        .insert({
          id: image.id,
          user_id: userId,
          file_name: image.file.name,
          preview_url: image.previewUrl,
          extracted_text: image.extractedText,
          company_name: image.companyName || "",
          sender_name: image.senderName || "",
          phone_number: image.phoneNumber || "",
          code: image.code || "",
          price: image.price || "",
          province: image.province || "",
          status: image.status,
          submitted: true,
          batch_id: image.batch_id || "default",
          storage_path: image.storage_path || null
        })
        .select();

      if (error) {
        // إذا كان الخطأ بسبب تكرار المفتاح، نحاول تحديث السجل الموجود
        if (error.code === '23505') { // رمز خطأ تكرار المفتاح في PostgreSQL
          console.warn("خطأ تكرار المفتاح، جاري محاولة التحديث بدلاً من الإدراج");
          
          // محاولة البحث عن السجل الموجود
          const { data: existingRecord } = await supabase
            .from('images')
            .select('id')
            .eq('file_name', image.file.name)
            .eq('user_id', userId)
            .maybeSingle();
            
          if (existingRecord) {
            // إذا وجدنا السجل، نقوم بتحديثه
            const { data: updatedRecord, error: updateError } = await supabase
              .from('images')
              .update({
                preview_url: image.previewUrl,
                extracted_text: image.extractedText,
                company_name: image.companyName || "",
                sender_name: image.senderName || "",
                phone_number: image.phoneNumber || "",
                code: image.code || "",
                price: image.price || "",
                province: image.province || "",
                status: image.status,
                submitted: true,
                batch_id: image.batch_id || "default",
                storage_path: image.storage_path || null
              })
              .eq('id', existingRecord.id)
              .select();
              
            if (!updateError && updatedRecord) {
              console.log("تم تحديث السجل الموجود بنجاح:", updatedRecord[0]);
              
              // تحديث الصورة في الواجهة
              updateImage(image.id, { 
                id: existingRecord.id,
                extractedText: updatedRecord[0].extracted_text,
                companyName: updatedRecord[0].company_name,
                senderName: updatedRecord[0].sender_name,
                phoneNumber: updatedRecord[0].phone_number,
                code: updatedRecord[0].code,
                price: updatedRecord[0].price,
                province: updatedRecord[0].province,
                status: updatedRecord[0].status as "processing" | "pending" | "completed" | "error",
                submitted: true
              });
              
              return updatedRecord[0];
            }
          }
        }
        
        console.error("خطأ في حفظ البيانات:", error);
        toast({
          title: "خطأ",
          description: `فشل حفظ البيانات: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      // تحديث حالة الصورة ليشير إلى أنها تم حفظها
      if (data && data[0]) {
        updateImage(image.id, { 
          submitted: true,
          extractedText: data[0].extracted_text,
          companyName: data[0].company_name,
          senderName: data[0].sender_name,
          phoneNumber: data[0].phone_number,
          code: data[0].code,
          price: data[0].price,
          province: data[0].province,
          status: data[0].status as "processing" | "pending" | "completed" | "error"
        });
      }

      console.log("تم حفظ البيانات بنجاح:", data?.[0]);
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ البيانات بنجاح",
      });
      
      return data?.[0];
    } catch (error: any) {
      console.error("خطأ في حفظ البيانات:", error);
      return null;
    }
  };

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

  // وظيفة لتحميل صور المستخدم من قاعدة البيانات - تحسين الأداء باستخدام التخزين المؤقت
  const loadUserImages = useCallback(async (userId: string | undefined, setAllImages: (images: ImageData[]) => void) => {
    if (!userId) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن تحميل الصور");
      return;
    }

    // استخدام التخزين المؤقت للطلبات لتجنب الاستدعاءات المتكررة
    return cacheDbRequest(`load_user_images_${userId}`, async () => {
      setIsLoadingUserImages(true);
      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("خطأ في جلب صور المستخدم:", error);
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء تحميل الصور الخاصة بك",
            variant: "destructive",
          });
          return;
        }

        if (data && data.length > 0) {
          console.log(`تم العثور على ${data.length} صورة للمستخدم`);
          
          // تحويل بيانات قاعدة البيانات إلى كائنات ImageData
          const loadedImages: ImageData[] = data.map((item: any, index: number) => {
            // إنشاء كائن File افتراضي للصور المخزنة سابقاً
            const dummyFile = new File([""], item.file_name || "unknown.jpg", { type: "image/jpeg" });
            
            // الحصول على عنوان URL العام للصورة من Storage
            let previewUrl = item.preview_url;
            if (item.storage_path) {
              const { data: publicUrlData } = supabase.storage
                .from('receipt_images')
                .getPublicUrl(item.storage_path);
              previewUrl = publicUrlData.publicUrl;
            }
            
            return {
              id: item.id,
              file: dummyFile,
              previewUrl: previewUrl,
              extractedText: item.extracted_text || "",
              code: item.code || "",
              senderName: item.sender_name || "",
              phoneNumber: item.phone_number || "",
              price: item.price || "",
              province: item.province || "",
              companyName: item.company_name || "",
              date: new Date(item.created_at),
              status: item.status as "processing" | "pending" | "completed" | "error" || "completed",
              submitted: item.submitted || false,
              number: data.length - index, // ترقيم تنازلي بناءً على ترتيب الاستلام
              user_id: item.user_id,
              batch_id: item.batch_id || 'default',
              storage_path: item.storage_path || null,
              created_at: item.created_at
            };
          });
          
          // تعيين الصور المحملة
          setAllImages(loadedImages);
        } else {
          console.log("لم يتم العثور على صور للمستخدم");
        }
      } catch (err) {
        console.error("خطأ أثناء تحميل صور المستخدم:", err);
      } finally {
        setIsLoadingUserImages(false);
      }
    }, 3000); // تخزين مؤقت لمدة 3 ثوانٍ
  }, [cacheDbRequest, toast]);

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

  // وظيفة إرسال البيانات إلى API وحفظها في قاعدة البيانات
  const handleSubmitToApi = async (id: string, image: ImageData, userId: string | undefined) => {
    let isSubmitting = true;
    
    try {
      // إعداد البيانات للإرسال
      const extractedData = {
        company_name: image.companyName || "",
        sender_name: image.senderName || "",
        phone_number: image.phoneNumber || "",
        code: image.code || "",
        price: image.price || "",
        province: image.province || ""
      };
      
      console.log("جاري إرسال البيانات إلى API...", extractedData);
      
      try {
        // إرسال البيانات إلى ويب هوك n8n
        const response = await fetch("https://ahmed0770.app.n8n.cloud/webhook-test/a9ee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractedData)
        });
        
        if (!response.ok) {
          throw new Error(`حدث خطأ أثناء الاستجابة: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("تم إرسال البيانات بنجاح:", data);

        // حفظ البيانات في قاعدة البيانات Supabase
        const savedData = await saveImageToDatabase(image, userId);
        
        toast({
          title: "نجاح",
          description: `تم إرسال البيانات بنجاح!`,
        });
        
        return true;
      } catch (apiError: any) {
        console.error("خطأ في اتصال API:", apiError);
        
        // نحاول حفظ البيانات في قاعدة البيانات على أي حال
        console.log("محاولة حفظ البيانات في قاعدة البيانات على الرغم من فشل API...");
        const savedData = await saveImageToDatabase(image, userId);
        
        if (savedData) {
          toast({
            title: "تم الحفظ",
            description: `تم حفظ البيانات في قاعدة البيانات، ولكن فشل إرسال البيانات إلى API: ${apiError.message}`,
            variant: "default" // تغيير من "warning" إلى "default"
          });
          
          return true;
        } else {
          throw new Error(`فشل إرسال البيانات إلى API والحفظ في قاعدة البيانات: ${apiError.message}`);
        }
      }
    } catch (error: any) {
      console.error("خطأ في إرسال البيانات:", error);
      
      toast({
        title: "خطأ",
        description: `فشل إرسال البيانات: ${error.message}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      isSubmitting = false;
    }
  };

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
    isLoadingUserImages,
    saveImageToDatabase,
    loadUserImages,
    handleSubmitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  };
};
