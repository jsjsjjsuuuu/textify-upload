
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { ImageData } from '@/types/ImageData';
import { useToast } from './use-toast';

interface UploadResult {
  success: boolean;
  path: string | null;
  error: string | null;
}

export const useSupabaseStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  /**
   * رفع ملف صورة إلى تخزين Supabase
   */
  const uploadImageToStorage = useCallback(async (
    file: File,
    userId: string,
    batchId: string = 'default'
  ): Promise<UploadResult> => {
    if (!file) {
      return { success: false, path: null, error: 'لم يتم توفير ملف' };
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // إنشاء اسم فريد للملف باستخدام معرف المستخدم وتاريخ الرفع
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${batchId}/${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log(`بدء رفع الملف ${file.name} إلى المسار ${filePath}`);
      
      // محاولة رفع الملف إلى Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('receipt_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      // تحديث شريط التقدم عند الانتهاء
      setUploadProgress(100);
      
      if (uploadError) {
        console.error('خطأ في رفع الملف إلى Supabase:', uploadError);
        throw uploadError;
      }
      
      console.log(`تم رفع الملف بنجاح إلى المسار ${data?.path}`);
      
      return { 
        success: true, 
        path: data?.path || null, 
        error: null 
      };
    } catch (error: any) {
      console.error('خطأ أثناء عملية الرفع:', error);
      toast({
        title: 'خطأ في رفع الملف',
        description: error.message || 'حدث خطأ أثناء رفع الملف',
        variant: 'destructive'
      });
      
      return { 
        success: false, 
        path: null, 
        error: error.message || 'حدث خطأ أثناء رفع الملف' 
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  }, [toast]);

  /**
   * حذف ملف صورة من تخزين Supabase
   */
  const deleteImageFromStorage = useCallback(async (storagePath: string): Promise<boolean> => {
    if (!storagePath) {
      console.warn('لم يتم توفير مسار تخزين للحذف');
      return false;
    }
    
    try {
      console.log(`محاولة حذف الملف من المسار ${storagePath}`);
      
      const { error } = await supabase.storage
        .from('receipt_images')
        .remove([storagePath]);
      
      if (error) {
        console.error('خطأ في حذف الملف من Supabase:', error);
        throw error;
      }
      
      console.log(`تم حذف الملف بنجاح من المسار ${storagePath}`);
      return true;
    } catch (error: any) {
      console.error('خطأ أثناء عملية الحذف:', error);
      toast({
        title: 'خطأ في حذف الملف',
        description: error.message || 'حدث خطأ أثناء حذف الملف',
        variant: 'destructive'
      });
      
      return false;
    }
  }, [toast]);

  /**
   * تحديث معلومات الصورة بمسار التخزين بعد الرفع
   */
  const updateImageWithStoragePath = useCallback((
    image: ImageData, 
    storagePath: string
  ): ImageData => {
    return {
      ...image,
      storage_path: storagePath
    };
  }, []);

  /**
   * الحصول على عنوان URL العام للصورة من Supabase Storage
   */
  const getPublicUrl = useCallback((storagePath: string): string | null => {
    if (!storagePath) {
      return null;
    }
    
    try {
      const { data } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(storagePath);
      
      return data?.publicUrl || null;
    } catch (error) {
      console.error('خطأ في الحصول على عنوان URL العام:', error);
      return null;
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadImageToStorage,
    deleteImageFromStorage,
    updateImageWithStoragePath,
    getPublicUrl
  };
};
