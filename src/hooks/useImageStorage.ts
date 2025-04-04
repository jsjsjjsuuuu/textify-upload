import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { v4 as uuidv4 } from 'uuid';

// مدة انتهاء صلاحية URL العامة (بالثواني)
const PUBLIC_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 أيام

export const useImageStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // التحقق من وجود مخزن التخزين وإنشاؤه إذا لم يكن موجودًا
  const ensureStorageBucketExists = useCallback(async (): Promise<boolean> => {
    try {
      // التحقق من وجود المخزن
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error("خطأ في التحقق من مخزن التخزين:", error);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'receipt_images');
      
      if (bucketExists) {
        console.log("مخزن التخزين موجود بالفعل");
        return true;
      }
      
      console.log("مخزن التخزين غير موجود، سيتم إنشاؤه...");
      
      // محاولة إنشاء المخزن إذا لم يكن موجودًا
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('receipt_images', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error("خطأ في إنشاء مخزن التخزين:", createError);
        return false;
      }
      
      console.log("تم إنشاء مخزن التخزين بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ غير متوقع عند التحقق من مخزن التخزين:", error);
      return false;
    }
  }, []);

  // رفع ملف الصورة إلى التخزين مع محاولات إعادة المحاولة
  const uploadImageToStorage = useCallback(async (
    file: File,
    userId: string,
    imageId: string,
    maxRetries: number = 2
  ): Promise<{ path: string | null; url: string | null; }> => {
    if (!file || !userId) {
      console.log("لم يتم توفير الملف أو معرف المستخدم");
      return { path: null, url: null };
    }

    try {
      // التأكد من وجود المخزن
      const bucketExists = await ensureStorageBucketExists();
      if (!bucketExists) {
        console.error("فشل في التحقق من وجود مخزن التخزين");
        return { path: null, url: null };
      }

      setIsUploading(true);

      // إنشاء اسم ملف فريد باستخدام طابع زمني ومعرف المستخدم
      const fileExt = file.name.split('.').pop();
      const fileName = `${imageId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log(`جاري رفع الملف إلى المسار: ${filePath}`);

      // محاولة الرفع مع إعادة المحاولة
      let uploadData = null;
      let uploadError = null;
      let attempt = 0;
      
      while (attempt <= maxRetries) {
        attempt++;
        console.log(`محاولة رفع الملف #${attempt}`);
        
        const uploadResult = await supabase.storage
          .from('receipt_images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (!uploadResult.error) {
          uploadData = uploadResult.data;
          break;
        } else {
          uploadError = uploadResult.error;
          console.error(`فشل في رفع الملف (محاولة ${attempt}/${maxRetries + 1}):`, uploadError);
          
          // انتظار قبل إعادة المحاولة
          if (attempt <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (uploadError && !uploadData) {
        toast({
          title: "خطأ في الرفع",
          description: `فشل رفع الصورة: ${uploadError.message}`,
          variant: "destructive"
        });
        return { path: null, url: null };
      }

      console.log("تم رفع الملف بنجاح:", uploadData?.path);

      // الحصول على URL العام للملف
      const { data: publicUrlData } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(filePath);
      
      // جلب URL منتهي الصلاحية كبديل إذا كان URL العام غير متاح
      let signedUrlData = null;
      
      if (!publicUrlData?.publicUrl) {
        const { data: signedUrl } = await supabase.storage
          .from('receipt_images')
          .createSignedUrl(filePath, PUBLIC_URL_EXPIRY);
        
        signedUrlData = signedUrl;
      }
      
      const finalUrl = publicUrlData?.publicUrl || signedUrlData?.signedUrl;
      console.log("تم الحصول على عنوان URL للصورة:", finalUrl);

      return {
        path: uploadData?.path || null,
        url: finalUrl || null
      };
    } catch (error) {
      console.error("خطأ غير متوقع في رفع الملف:", error);
      return { path: null, url: null };
    } finally {
      setIsUploading(false);
    }
  }, [ensureStorageBucketExists, toast]);

  // حذف الملف من التخزين - تم تعديل نوع الإرجاع ليكون Promise<void>
  const deleteImageFromStorage = useCallback(async (path: string): Promise<void> => {
    if (!path) {
      return; // لا يوجد ملف للحذف
    }

    try {
      const { error } = await supabase.storage
        .from('receipt_images')
        .remove([path]);

      if (error) {
        console.error(`خطأ في حذف الملف ${path}:`, error);
        throw error;
      }

      console.log(`تم حذف الملف ${path} بنجاح`);
    } catch (error) {
      console.error(`خطأ غير متوقع في حذف الملف ${path}:`, error);
      throw error;
    }
  }, []);

  // إنشاء معاينة للصورة من الملف
  const createImagePreview = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // إعداد صورة جديدة مع إضافة ملف التخزين
  const prepareNewImage = useCallback(async (
    file: File, 
    userId: string | undefined,
    additionalData: Partial<ImageData> = {}
  ): Promise<ImageData> => {
    // إنشاء معرف فريد للصورة
    const imageId = additionalData.id || uuidv4();
    
    // إنشاء معاينة للصورة
    const previewUrl = await createImagePreview(file);
    
    // رفع الصورة إلى التخزين إذا كان هناك معرف مستخدم
    let storagePath = null;
    let publicUrl = previewUrl;
    
    if (userId) {
      const storage = await uploadImageToStorage(file, userId, imageId);
      storagePath = storage.path;
      // استخدام URL العام إذا كان متاحًا، وإلا استخدام عنوان المعاينة
      if (storage.url) {
        publicUrl = storage.url;
      }
    }
    
    // إنشاء كائن الصورة
    const newImage: ImageData = {
      id: imageId,
      file: file,
      previewUrl: publicUrl,
      extractedText: "",
      code: "",
      senderName: "",
      phoneNumber: "",
      price: "",
      province: "",
      companyName: "",
      date: new Date(),
      status: "pending",
      submitted: false,
      user_id: userId,
      storage_path: storagePath,
      ...additionalData
    };
    
    return newImage;
  }, [createImagePreview, uploadImageToStorage]);

  return {
    isUploading,
    uploadImageToStorage,
    deleteImageFromStorage,
    createImagePreview,
    prepareNewImage,
    ensureStorageBucketExists
  };
};
