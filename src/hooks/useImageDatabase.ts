
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const MAX_RECORDS_PER_USER = 100; // تعديل الحد الأقصى لعدد السجلات لكل مستخدم إلى 100 بدلاً من 9

export const useImageDatabase = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const { toast } = useToast();

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
        
        // بعد التحديث، تأكد من عدم تجاوز الحد الأقصى للسجلات
        await cleanupOldRecords(userId);
        
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

      // تعديل هنا: تحقق من وجود سجل بنفس اسم الملف للمستخدم الحالي
      const { data: existingByFileName, error: fileNameCheckError } = await supabase
        .from('images')
        .select('id')
        .eq('user_id', userId)
        .eq('file_name', image.file.name)
        .maybeSingle();
        
      if (fileNameCheckError) {
        console.error("خطأ في التحقق من تكرار اسم الملف:", fileNameCheckError);
      }
      
      // إذا كان هناك سجل بنفس اسم الملف، قم بتحديثه بدلاً من إضافة سجل جديد
      if (existingByFileName) {
        console.log("تم العثور على ملف بنفس الاسم، جاري التحديث:", existingByFileName.id);
        
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
            storage_path: image.storage_path || null
          })
          .eq('id', existingByFileName.id)
          .select();

        if (updateError) {
          console.error("خطأ في تحديث السجل الموجود:", updateError);
          throw updateError;
        }

        console.log("تم تحديث السجل الموجود بنجاح:", updatedData?.[0]);
        
        // تحديث معرف الصورة المحلية ليتوافق مع السجل في قاعدة البيانات
        if (updatedData && updatedData[0]) {
          updateImage(image.id, { 
            id: existingByFileName.id,
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
          id: image.id, // استخدم نفس المعرف لضمان الانسجام بين الواجهة وقاعدة البيانات
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
          storage_path: image.storage_path || null // إضافة مسار التخزين
        })
        .select();

      if (error) {
        // إذا كان الخطأ بسبب تكرار المفتاح، نحاول تحديث السجل الموجود
        if (error.code === '23505') { // رمز خطأ تكرار المفتاح في PostgreSQL
          console.warn("خطأ تكرار المفتاح، جاري محاولة التحديث بدلاً من الإدراج");
          
          // إنشاء معرف جديد للصورة
          const newId = crypto.randomUUID();
          console.log("استخدام معرف جديد:", newId);
          
          // محاولة إدراج السجل باستخدام معرف جديد
          const { data: retryData, error: retryError } = await supabase
            .from('images')
            .insert({
              id: newId,
              user_id: userId,
              file_name: `${new Date().getTime()}_${image.file.name}`, // إضافة طابع زمني لضمان فرادة اسم الملف
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
            
          if (retryError) {
            console.error("فشلت محاولة إعادة الإدراج:", retryError);
            throw retryError;
          }
          
          // تحديث معرف الصورة في الواجهة
          if (retryData && retryData[0]) {
            updateImage(image.id, { 
              id: newId,
              extractedText: retryData[0].extracted_text,
              companyName: retryData[0].company_name,
              senderName: retryData[0].sender_name,
              phoneNumber: retryData[0].phone_number,
              code: retryData[0].code,
              price: retryData[0].price,
              province: retryData[0].province,
              status: retryData[0].status as "processing" | "pending" | "completed" | "error",
              submitted: true
            });
          }
          
          console.log("تم إدراج السجل بنجاح باستخدام معرف جديد:", retryData?.[0]);
          return retryData?.[0];
        } else {
          console.error("خطأ في حفظ البيانات:", error);
          toast({
            title: "خطأ",
            description: `فشل حفظ البيانات: ${error.message}`,
            variant: "destructive",
          });
          return null;
        }
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
      
      // بعد الإضافة، تأكد من عدم تجاوز الحد الأقصى للسجلات
      await cleanupOldRecords(userId);
      
      return data?.[0];
    } catch (error: any) {
      console.error("خطأ في حفظ البيانات:", error);
      return null;
    }
  };

  // وظيفة لحذف الملفات من Storage
  const deleteFileFromStorage = async (storagePath: string | null): Promise<boolean> => {
    if (!storagePath) {
      console.log("لا يوجد مسار تخزين للحذف");
      return true; // نعتبر العملية ناجحة لأنه لا يوجد ما يحذف
    }

    try {
      console.log(`جاري حذف الملف من التخزين: ${storagePath}`);
      
      const { error } = await supabase.storage
        .from('receipt_images')
        .remove([storagePath]);
      
      if (error) {
        console.error(`خطأ في حذف الملف ${storagePath} من التخزين:`, error);
        return false;
      }
      
      console.log(`تم حذف الملف ${storagePath} من التخزين بنجاح`);
      return true;
    } catch (error) {
      console.error(`خطأ غير متوقع أثناء حذف الملف ${storagePath}:`, error);
      return false;
    }
  };

  // وظيفة لتنظيف جميع الملفات القديمة في Storage لمستخدم معين
  const cleanupStorageFiles = async (userId: string) => {
    try {
      console.log(`بدء تنظيف ملفات التخزين للمستخدم: ${userId}`);
      
      // 1. الحصول على قائمة الملفات في تخزين المستخدم
      const { data: files, error } = await supabase.storage
        .from('receipt_images')
        .list(userId);
      
      if (error) {
        console.error(`خطأ في جلب قائمة ملفات المستخدم ${userId}:`, error);
        return;
      }
      
      console.log(`تم العثور على ${files.length} ملف في تخزين المستخدم ${userId}`);
      
      // 2. الحصول على قائمة مسارات التخزين الحالية التي يجب الاحتفاظ بها
      const { data: currentPaths, error: pathError } = await supabase
        .from('images')
        .select('storage_path')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_RECORDS_PER_USER);
      
      if (pathError) {
        console.error(`خطأ في جلب مسارات التخزين الحالية للمستخدم ${userId}:`, pathError);
        return;
      }
      
      // إنشاء مجموعة من مسارات التخزين التي يجب الاحتفاظ بها
      const validPaths = new Set(
        currentPaths
          .filter(item => item.storage_path)
          .map(item => {
            // استخراج اسم الملف فقط من المسار الكامل
            const pathParts = item.storage_path.split('/');
            return pathParts[pathParts.length - 1];
          })
      );
      
      console.log(`عدد مسارات التخزين الصالحة: ${validPaths.size}`);
      
      // 3. حذف الملفات التي ليست في قائمة المسارات الصالحة
      let deletedCount = 0;
      for (const file of files) {
        if (!validPaths.has(file.name)) {
          console.log(`حذف ملف غير مرتبط بسجل: ${userId}/${file.name}`);
          const deleted = await deleteFileFromStorage(`${userId}/${file.name}`);
          if (deleted) deletedCount++;
        }
      }
      
      console.log(`تم حذف ${deletedCount} ملف غير مرتبط بسجلات حالية`);
      
    } catch (error) {
      console.error(`خطأ أثناء تنظيف ملفات التخزين للمستخدم ${userId}:`, error);
    }
  };

  // وظيفة لتنظيف السجلات القديمة والاحتفاظ فقط بأحدث MAX_RECORDS_PER_USER سجل
  const cleanupOldRecords = async (userId: string) => {
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
        
        // ج. حذف الملفات من التخزين أولاً (إذا كانت موجودة)
        let deletedFilesCount = 0;
        for (const record of oldestRecords) {
          if (record.storage_path) {
            console.log(`محاولة حذف الملف: ${record.storage_path}`);
            const deleted = await deleteFileFromStorage(record.storage_path);
            if (deleted) {
              deletedFilesCount++;
              console.log(`تم حذف الملف ${record.storage_path} من التخزين بنجاح`);
            } else {
              console.error(`فشل حذف الملف ${record.storage_path} من التخزين`);
            }
          }
        }
        
        console.log(`تم حذف ${deletedFilesCount} ملف من أصل ${oldestRecords.length} سجل`);
        
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
        
        // و. تنظيف جميع الملفات غير المرتبطة في التخزين
        await cleanupStorageFiles(userId);
      } else {
        // حتى إذا لم يكن هناك سجلات لحذفها، نقوم بتنظيف ملفات التخزين للتأكد
        await cleanupStorageFiles(userId);
      }
    } catch (error) {
      console.error("خطأ في عملية تنظيف السجلات القديمة:", error);
    }
  };

  // وظيفة جديدة لحذف السجل من قاعدة البيانات
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
      
      // إذا كان هناك ملف مخزن في Storage، نقوم بحذفه أولاً
      if (existingImage.storage_path) {
        console.log("محاولة حذف الملف من التخزين:", existingImage.storage_path);
        const deleted = await deleteFileFromStorage(existingImage.storage_path);
        if (!deleted) {
          console.error("لم يتم حذف الملف من التخزين بنجاح");
          // نستمر في حذف السجل من قاعدة البيانات حتى لو فشل حذف الملف
        } else {
          console.log("تم حذف الملف من التخزين بنجاح:", existingImage.storage_path);
        }
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

  // وظيفة لتحميل صور المستخدم من قاعدة البيانات
  const loadUserImages = async (userId: string | undefined, setAllImages: (images: ImageData[]) => void) => {
    if (!userId) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن تحميل الصور");
      return;
    }

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
          
          // طباعة بيانات الصورة من قاعدة البيانات للتأكد من وجود البيانات
          console.log(`صورة ${index+1} - المعرف: ${item.id}, النص المستخرج: ${item.extracted_text?.substring(0, 20)}..., الكود: ${item.code}, الاسم: ${item.sender_name}`);
          
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
            storage_path: item.storage_path || null
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
  };

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
        
        // تحديث حالة الصورة
        updateImage(id, { status: "completed", submitted: true });
        
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
          // تحديث حالة الصورة
          updateImage(id, { status: "completed", submitted: true });
          
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
      updateImage(id, { status: "error" });
      
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
