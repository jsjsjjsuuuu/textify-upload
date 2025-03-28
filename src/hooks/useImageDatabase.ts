import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// مدة انتهاء صلاحية الصور القديمة (30 يوم)
const OLD_IMAGE_EXPIRY_DAYS = 30;
// الحد الأقصى لعدد السجلات المحتفظ بها لكل مستخدم
const MAX_RECORDS_PER_USER = 100;

export const useImageDatabase = (updateImage: (id: string, update: Partial<ImageData>) => void) => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const { toast } = useToast();

  // تحميل صور المستخدم من قاعدة البيانات
  const loadUserImages = async (userId: string, setAllImages: (images: ImageData[]) => void) => {
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
            // إضافة حقول إضافية
            added_at: new Date(imageData.created_at).getTime(),
            notes1: imageData.notes1,
            recipientName: imageData.recipient_name,
            // رقم ترتيبي مؤقت
            number: data.length - index
          };
        });
        
        // تنقية الصور من التكرارات قبل تعيينها
        const uniqueImagesMap = new Map<string, ImageData>();
        
        convertedImages.forEach(img => {
          // إنشاء مفتاح أكثر شمولاً
          const key = `${img.file.name}_${img.user_id || ''}_${img.batch_id || ''}`;
          
          // إذا لم يكن هناك صورة بهذا المفتاح، أو الصورة الجديدة أحدث، أو الصورة القديمة في حالة خطأ
          const existingImage = uniqueImagesMap.get(key);
          const shouldReplace = !existingImage || 
            (img.added_at && existingImage.added_at && img.added_at > existingImage.added_at) ||
            (existingImage.status === 'error' && img.status !== 'error');
          
          if (shouldReplace) {
            uniqueImagesMap.set(key, img);
          }
        });
        
        const uniqueImages = Array.from(uniqueImagesMap.values());
        console.log(`تم إزالة ${convertedImages.length - uniqueImages.length} صورة مكررة من قاعدة البيانات`);
        
        // تحديث الحالة بالصور الفريدة فقط
        setAllImages(uniqueImages);
      } else {
        console.log("لا توجد صور مخزنة للمستخدم");
        setAllImages([]);
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
  
  // التحقق من وجود سجل مكرر قبل الإدخال
  const checkDuplicateRecord = async (image: ImageData): Promise<boolean> => {
    try {
      if (!image.user_id || !image.file?.name) {
        return false;
      }
      
      const { data, error } = await supabase
        .from('images')
        .select('id')
        .eq('user_id', image.user_id)
        .eq('file_name', image.file.name);
      
      if (error) {
        console.error("خطأ في التحقق من التكرار:", error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error("خطأ في التحقق من التكرار:", error);
      return false;
    }
  };
  
  // حفظ صورة معالجة في قاعدة البيانات - تم تصحيح المعلمات
  const saveImageToDatabase = async (image: ImageData) => {
    try {
      console.log("جاري حفظ الصورة في قاعدة البيانات:", image.id);
      
      // التحقق من وجود سجل مكرر
      const isDuplicate = await checkDuplicateRecord(image);
      if (isDuplicate) {
        console.log("تم العثور على سجل مكرر، سيتم التحديث بدلاً من الإدراج");
      }
      
      const { data, error } = await supabase
        .from('images')
        .upsert([
          {
            id: image.id,
            file_name: image.file.name,
            preview_url: image.previewUrl,
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
            batch_id: image.batch_id,
            notes1: image.notes1,
            recipient_name: image.recipientName
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

  // إرسال البيانات إلى API
  const handleSubmitToApi = async (id: string, image: ImageData, userId?: string) => {
    try {
      console.log(`محاولة إرسال البيانات إلى API للصورة: ${id}`);

      // حفظ الصورة في قاعدة البيانات
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
      return true;
    } catch (error) {
      console.error("خطأ في إرسال البيانات إلى API:", error);
      return false;
    }
  };

  // حذف صورة من قاعدة البيانات
  const deleteImageFromDatabase = async (id: string) => {
    try {
      console.log("جاري حذف الصورة من قاعدة البيانات:", id);

      // الحصول على معلومات الصورة أولاً للتحقق من ملف التخزين
      const { data: imageData } = await supabase
        .from('images')
        .select('storage_path')
        .eq('id', id)
        .single();
      
      // حذف ملف التخزين إذا كان موجوداً
      if (imageData?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('receipt_images')
          .remove([imageData.storage_path]);
          
        if (storageError) {
          console.error("خطأ في حذف ملف التخزين:", storageError);
          // نستمر في حذف السجل حتى لو فشل حذف ملف التخزين
        } else {
          console.log("تم حذف ملف التخزين:", imageData.storage_path);
        }
      }

      // حذف السجل من قاعدة البيانات
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("خطأ في حذف الصورة:", error);
        throw error;
      }

      console.log("تم حذف الصورة بنجاح من قاعدة البيانات:", id);
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
  
  // تنظيف السجلات القديمة والزائدة في قاعدة البيانات
  const cleanupOldRecords = async (userId: string) => {
    try {
      // حساب التاريخ قبل عدد محدد من الأيام
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - OLD_IMAGE_EXPIRY_DAYS);
      const cutoffString = cutoffDate.toISOString();
      
      console.log(`تنظيف السجلات القديمة قبل ${cutoffString} للمستخدم ${userId}`);
      
      // 1. حذف السجلات القديمة أولاً
      const { count: oldRecordsCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('created_at', cutoffString);
      
      if (oldRecordsCount && oldRecordsCount > 0) {
        console.log(`سيتم حذف ${oldRecordsCount} سجل قديم`);
        
        // احصل على مسارات التخزين للسجلات القديمة
        const { data: oldStoragePaths } = await supabase
          .from('images')
          .select('storage_path')
          .eq('user_id', userId)
          .lt('created_at', cutoffString);
        
        // حذف السجلات القديمة
        const { error } = await supabase
          .from('images')
          .delete()
          .eq('user_id', userId)
          .lt('created_at', cutoffString);
        
        if (error) {
          console.error("خطأ في حذف السجلات القديمة:", error);
        } else {
          console.log(`تم حذف ${oldRecordsCount} سجل قديم بنجاح`);
          
          // حذف ملفات التخزين المرتبطة
          if (oldStoragePaths && oldStoragePaths.length > 0) {
            const validPaths = oldStoragePaths
              .map(item => item.storage_path)
              .filter(path => path && typeof path === 'string');
            
            if (validPaths.length > 0) {
              console.log(`محاولة حذف ${validPaths.length} ملف تخزين قديم`);
              
              const { error: storageError } = await supabase.storage
                .from('receipt_images')
                .remove(validPaths);
              
              if (storageError) {
                console.error("خطأ في حذف ملفات التخزين:", storageError);
              } else {
                console.log(`تم حذف ${validPaths.length} ملف تخزين بنجاح`);
              }
            }
          }
        }
      } else {
        console.log("لا توجد سجلات قديمة للحذف");
      }
      
      // 2. إذا تجاوز عدد السجلات الحد الأقصى، احذف السجلات الأقدم
      const { count: totalCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (totalCount && totalCount > MAX_RECORDS_PER_USER) {
        const recordsToDelete = totalCount - MAX_RECORDS_PER_USER;
        console.log(`عدد السجلات (${totalCount}) يتجاوز الحد الأقصى (${MAX_RECORDS_PER_USER})، سيتم حذف ${recordsToDelete} سجل`);
        
        // الحصول على معرفات السجلات الأقدم للحذف
        const { data: oldestRecords } = await supabase
          .from('images')
          .select('id, storage_path')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(recordsToDelete);
        
        if (oldestRecords && oldestRecords.length > 0) {
          const idsToDelete = oldestRecords.map(record => record.id);
          const pathsToDelete = oldestRecords
            .map(record => record.storage_path)
            .filter(path => path && typeof path === 'string');
          
          // حذف السجلات
          const { error } = await supabase
            .from('images')
            .delete()
            .in('id', idsToDelete);
          
          if (error) {
            console.error("خطأ في حذف السجلات الزائدة:", error);
          } else {
            console.log(`تم حذف ${idsToDelete.length} سجل زائد بنجاح`);
            
            // حذف ملفات التخزين المرتبطة
            if (pathsToDelete.length > 0) {
              const { error: storageError } = await supabase.storage
                .from('receipt_images')
                .remove(pathsToDelete);
              
              if (storageError) {
                console.error("خطأ في حذف ملفات التخزين للسجلات الزائدة:", storageError);
              } else {
                console.log(`تم حذف ${pathsToDelete.length} ملف تخزين للسجلات الزائدة بنجاح`);
              }
            }
          }
        }
      }
      
      // 3. تنظيف السجلات المكررة
      const { data: allRecords } = await supabase
        .from('images')
        .select('id, file_name, user_id, batch_id')
        .eq('user_id', userId);
      
      if (allRecords && allRecords.length > 0) {
        // إنشاء خريطة للعثور على التكرارات
        const recordMap = new Map<string, string[]>();
        
        // تجميع السجلات حسب اسم الملف والمستخدم والدفعة
        allRecords.forEach(record => {
          const key = `${record.file_name}_${record.user_id}_${record.batch_id || 'default'}`;
          const ids = recordMap.get(key) || [];
          ids.push(record.id);
          recordMap.set(key, ids);
        });
        
        // حدد التكرارات (المفاتيح التي لها أكثر من معرف)
        const duplicates: string[] = [];
        recordMap.forEach((ids, key) => {
          if (ids.length > 1) {
            // نحتفظ بالمعرف الأول ونحذف الباقي
            duplicates.push(...ids.slice(1));
          }
        });
        
        if (duplicates.length > 0) {
          console.log(`تم العثور على ${duplicates.length} سجل مكرر، سيتم حذفها`);
          
          // الحصول على مسارات التخزين للسجلات المكررة
          const { data: duplicateStoragePaths } = await supabase
            .from('images')
            .select('storage_path')
            .in('id', duplicates);
          
          // حذف السجلات المكررة
          const { error } = await supabase
            .from('images')
            .delete()
            .in('id', duplicates);
          
          if (error) {
            console.error("خطأ في حذف السجلات المكررة:", error);
          } else {
            console.log(`تم حذف ${duplicates.length} سجل مكرر بنجاح`);
            
            // حذف ملفات التخزين المرتبطة
            if (duplicateStoragePaths && duplicateStoragePaths.length > 0) {
              const validPaths = duplicateStoragePaths
                .map(item => item.storage_path)
                .filter(path => path && typeof path === 'string');
              
              if (validPaths.length > 0) {
                const { error: storageError } = await supabase.storage
                  .from('receipt_images')
                  .remove(validPaths);
                
                if (storageError) {
                  console.error("خطأ في حذف ملفات التخزين للسجلات المكررة:", storageError);
                } else {
                  console.log(`تم حذف ${validPaths.length} ملف تخزين للسجلات المكررة بنجاح`);
                }
              }
            }
          }
        } else {
          console.log("لا توجد سجلات مكررة للحذف");
        }
      }
    } catch (error) {
      console.error("خطأ في تنظيف السجلات:", error);
    }
  };
  
  // وظيفة تنفيذ التنظيف الآن
  const runCleanupNow = async (userId: string) => {
    try {
      toast({
        title: "جاري التنظيف",
        description: "جاري تنظيف السجلات القديمة والمكررة...",
      });
      
      await cleanupOldRecords(userId);
      
      toast({
        title: "اكتمل التنظيف",
        description: "تم تنظيف السجلات القديمة والمكررة بنجاح",
      });
    } catch (error) {
      console.error("خطأ في تنفيذ التنظيف:", error);
      toast({
        title: "خطأ في التنظيف",
        description: "تعذر تنظيف السجلات",
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
