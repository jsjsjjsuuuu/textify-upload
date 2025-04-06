
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * رفع ملف إلى Supabase Storage
   * @param file الملف المراد رفعه
   * @param bucketName اسم الـ bucket
   * @param filePath المسار داخل الـ bucket
   */
  const uploadFile = useCallback(
    async (file: File, bucketName: string, filePath: string): Promise<string | null> => {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        // التحقق من صحة المدخلات
        if (!file) {
          throw new Error('لم يتم توفير ملف للرفع');
        }

        if (!bucketName) {
          throw new Error('لم يتم تحديد اسم الـ bucket');
        }

        if (!filePath) {
          // إنشاء مسار افتراضي باستخدام اسم الملف
          filePath = `${Date.now()}_${file.name}`;
        }

        console.log(`جاري رفع الملف: ${filePath} إلى البكت: ${bucketName}`);

        // رفع الملف إلى Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            onUploadProgress: (progress) => {
              // تحديث نسبة التقدم
              const progressPercentage = (progress.loaded / progress.total) * 100;
              setUploadProgress(progressPercentage);
              console.log(`تقدم الرفع: ${progressPercentage.toFixed(2)}%`);
            },
          });

        if (error) {
          throw error;
        }

        // الحصول على عنوان URL العام للملف المرفوع
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data?.path || filePath);

        console.log('تم الرفع بنجاح:', urlData.publicUrl);

        setUploadProgress(100);

        return urlData.publicUrl;
      } catch (err) {
        console.error('خطأ في رفع الملف:', err);
        setError(err.message || 'حدث خطأ غير معروف أثناء رفع الملف');
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  /**
   * حذف ملف من Supabase Storage
   * @param bucketName اسم الـ bucket
   * @param filePath المسار داخل الـ bucket
   */
  const deleteFile = useCallback(
    async (bucketName: string, filePath: string): Promise<boolean> => {
      try {
        setError(null);

        if (!bucketName || !filePath) {
          throw new Error('لم يتم توفير معلومات كافية لحذف الملف');
        }

        console.log(`جاري حذف الملف: ${filePath} من البكت: ${bucketName}`);

        const { error } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);

        if (error) {
          throw error;
        }

        console.log('تم حذف الملف بنجاح');
        return true;
      } catch (err) {
        console.error('خطأ في حذف الملف:', err);
        setError(err.message || 'حدث خطأ غير معروف أثناء حذف الملف');
        return false;
      }
    },
    []
  );

  /**
   * الحصول على قائمة بالملفات في مجلد معين
   * @param bucketName اسم الـ bucket
   * @param folderPath مسار المجلد داخل الـ bucket
   */
  const listFiles = useCallback(
    async (bucketName: string, folderPath?: string) => {
      try {
        setError(null);

        if (!bucketName) {
          throw new Error('لم يتم تحديد اسم الـ bucket');
        }

        const { data, error } = await supabase.storage
          .from(bucketName)
          .list(folderPath || '');

        if (error) {
          throw error;
        }

        return data;
      } catch (err) {
        console.error('خطأ في جلب قائمة الملفات:', err);
        setError(err.message || 'حدث خطأ غير معروف أثناء جلب قائمة الملفات');
        return [];
      }
    },
    []
  );

  /**
   * تنزيل ملف من Supabase Storage
   * @param bucketName اسم الـ bucket
   * @param filePath المسار داخل الـ bucket
   */
  const downloadFile = useCallback(
    async (bucketName: string, filePath: string) => {
      try {
        setError(null);

        if (!bucketName || !filePath) {
          throw new Error('لم يتم توفير معلومات كافية لتنزيل الملف');
        }

        console.log(`جاري تنزيل الملف: ${filePath} من البكت: ${bucketName}`);

        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filePath);

        if (error) {
          throw error;
        }

        return data;
      } catch (err) {
        console.error('خطأ في تنزيل الملف:', err);
        setError(err.message || 'حدث خطأ غير معروف أثناء تنزيل الملف');
        return null;
      }
    },
    []
  );

  return {
    uploadFile,
    deleteFile,
    listFiles,
    downloadFile,
    isUploading,
    uploadProgress,
    error,
  };
};
