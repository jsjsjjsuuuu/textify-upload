
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// تعريف أنواع Buckets المتاحة
export const STORAGE_BUCKETS = {
  IMAGES: "images",
  PROFILE: "profiles",
  TEMP: "temp"
} as const;

export type BucketName = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");

  /**
   * رفع ملف إلى تخزين Supabase
   */
  const uploadFile = async (file: File, bucketName: string, filePath: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError("");

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Storage error:", error);
        setError(`خطأ في رفع الملف: ${error.message}`);
        return null;
      }

      // إذا تم الرفع بنجاح، نحصل على عنوان URL العام
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setUploadProgress(100);
      
      // إرجاع المسار للتخزين
      return filePath;
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(`خطأ غير متوقع: ${err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * حذف ملف من تخزين Supabase
   */
  const deleteFile = async (bucketName: string, filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error("Error deleting file:", error);
        setError(`خطأ في حذف الملف: ${error.message}`);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(`خطأ غير متوقع: ${err.message}`);
      return false;
    }
  };

  /**
   * الحصول على رابط عام للملف
   */
  const getPublicUrl = (bucketName: string, filePath: string): string => {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  };

  /**
   * إنشاء مجلد جديد في التخزين (لا يوجد API مباشر، لذا نستخدم ملفًا فارغًا كعلامة)
   */
  const createFolder = async (bucketName: string, folderPath: string): Promise<boolean> => {
    try {
      // إنشاء ملف وهمي باسم ".folder" في المسار المطلوب
      const emptyFile = new File([""], ".folder", { type: "application/octet-stream" });
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${folderPath}/.folder`, emptyFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Error creating folder:", error);
        setError(`خطأ في إنشاء المجلد: ${error.message}`);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("Folder creation error:", err);
      setError(`خطأ غير متوقع: ${err.message}`);
      return false;
    }
  };
  
  // إضافة وظيفة uploadImageToStorage للتوافق مع الاستخدام في useImageProcessingCore
  const uploadImageToStorage = async (file: File, userId: string, imageId: string): Promise<string | null> => {
    if (!file || !userId) {
      console.error("ملف غير صالح أو معرف مستخدم غير موجود");
      return null;
    }

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${imageId}_${timestamp}.${fileExt}`;
    
    console.log(`جاري رفع الصورة إلى التخزين: ${filePath}`);
    
    // استخدام bucket الصحيح "images" بدلاً من "receipt_images"
    return uploadFile(file, STORAGE_BUCKETS.IMAGES, filePath);
  };

  return {
    uploadFile,
    deleteFile,
    getPublicUrl,
    createFolder,
    uploadImageToStorage,  // إضافة الوظيفة للتصدير
    isUploading,
    uploadProgress,
    error
  };
};
