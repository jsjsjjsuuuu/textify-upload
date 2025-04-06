import { useState, useCallback, useEffect } from 'react';
import { ImageData } from '@/types/ImageData';
import { useImageDatabase } from './useImageDatabase';
import { useFileUpload } from './useFileUpload';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getApiKeyStats } from '@/lib/gemini';
import { loadProcessedHashesFromStorage } from '@/utils/duplicateDetection';

export const useImageProcessing = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // وظيفة الإضافة للصورة
  const addImage = useCallback((image: ImageData) => {
    setImages(prevImages => [...prevImages, image]);
  }, []);
  
  // وظيفة تحديث الصورة
  const updateImage = useCallback((id: string, fields: Partial<ImageData>) => {
    setImages(prevImages =>
      prevImages.map(image => (image.id === id ? { ...image, ...fields } : image))
    );
  }, []);
  
  // استيراد useDuplicateDetection
  const { isDuplicateImage, removeDuplicates } = useDuplicateDetection(images);
  
  // Load processed hashes from local storage on component mount
  useEffect(() => {
    loadProcessedHashesFromStorage();
  }, []);
  
  // Initialize useImageDatabase with the updateImage function
  const {
    isLoadingUserImages,
    saveImageToDatabase,
    loadUserImages: loadImagesFromDatabase,
    handleSubmitToApi,
    deleteImageFromDatabase,
    cleanupOldRecords,
    runCleanupNow
  } = useImageDatabase(updateImage);
  
  // وظيفة حفظ الصورة المعالجة
  const saveProcessedImage = useCallback(async (image: ImageData) => {
    if (user) {
      await saveImageToDatabase(image, user.id);
    } else {
      console.warn("User not logged in, cannot save image.");
    }
  }, [user, saveImageToDatabase]);
  
  // Initialize useFileUpload
  const {
    isProcessing,
    handleFileChange,
    activeUploads,
    queueLength,
    useGemini,
    pauseProcessing,
    clearQueue,
    manuallyTriggerProcessingQueue,
    getProcessingState,
    clearProcessedHashesCache
  } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage,
    isDuplicateImage,
    removeDuplicates
  });
  
  // وظيفة تحميل صور المستخدم
  const loadUserImages = useCallback(() => {
    if (user) {
      loadImagesFromDatabase(user.id, setImages);
    }
  }, [user, loadImagesFromDatabase]);
  
  useEffect(() => {
    if (user) {
      loadUserImages();
    }
  }, [user, loadUserImages]);
  
  // وظيفة حذف الصورة
  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      // أولاً، احذف الصورة من قاعدة البيانات
      await deleteImageFromDatabase(id);
      
      // ثم قم بتحديث الحالة المحلية
      setImages(prevImages => prevImages.filter(image => image.id !== id));
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الصورة بنجاح",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast({
        title: "خطأ",
        description: `فشل حذف الصورة: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  }, [deleteImageFromDatabase, toast]);
  
  // حذف صور الجلسة الحالية
  const clearSessionImages = useCallback(() => {
    setImages([]);
  }, []);
  
  // معالجة الخطأ مع إشعار
  const handleError = (id: string, errorMessage: string, isApiKeyError = false) => {
    updateImage(id, {
      status: "error",
      error: errorMessage,
      apiKeyError: isApiKeyError
    });
  };
  
  // تغيير النص في بيانات الصورة
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value });
  }, [updateImage]);
  
  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  return {
    images,
    isLoadingUserImages,
    isProcessing,
    processingProgress,
    currentlyProcessingId,
    isSubmitting: false, // سيتم إدارة هذا داخليًا حسب الحاجة
    activeUploads,
    queueLength,
    useGemini,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    clearSessionImages,
    loadUserImages,
    runCleanupNow,
    saveProcessedImage,
    isDuplicateImage,
    removeDuplicates,
    retryProcessing: manuallyTriggerProcessingQueue,
    pauseProcessing,
    clearQueue,
    getProcessingState,
    clearProcessedHashesCache
  };
};

// إضافة استيراد useDuplicateDetection لمنع الخطأ
import { useDuplicateDetection } from './useDuplicateDetection';
