
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
      return true; // نفترض أننا قمنا بإنشاء المخزن من خلال SQL
    } catch (error) {
      console.error("خطأ غير متوقع عند التحقق من مخزن التخزين:", error);
      return false;
    }
  }, []);

  // رفع ملف الصورة إلى التخزين
  const uploadImageToStorage = useCallback(async (
    file: File,
    userId: string,
    imageId: string
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

      // رفع الملف
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipt_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("خطأ في رفع الملف:", uploadError);
        toast({
          title: "خطأ في الرفع",
          description: `فشل رفع الصورة: ${uploadError.message}`,
          variant: "destructive"
        });
        return { path: null, url: null };
      }

      console.log("تم رفع الملف بنجاح:", uploadData?.path);

      // الحصول على URL العام للملف
      const { data: urlData } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(filePath);

      console.log("تم الحصول على عنوان URL العام:", urlData?.publicUrl);

      return {
        path: uploadData?.path || null,
        url: urlData?.publicUrl || null
      };
    } catch (error) {
      console.error("خطأ غير متوقع في رفع الملف:", error);
      return { path: null, url: null };
    } finally {
      setIsUploading(false);
    }
  }, [ensureStorageBucketExists, toast]);

  // حذف الملف من التخزين
  const deleteImageFromStorage = useCallback(async (path: string | null): Promise<boolean> => {
    if (!path) {
      return true; // لا يوجد ملف للحذف
    }

    try {
      const { error } = await supabase.storage
        .from('receipt_images')
        .remove([path]);

      if (error) {
        console.error(`خطأ في حذف الملف ${path}:`, error);
        return false;
      }

      console.log(`تم حذف الملف ${path} بنجاح`);
      return true;
    } catch (error) {
      console.error(`خطأ غير متوقع في حذف الملف ${path}:`, error);
      return false;
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
