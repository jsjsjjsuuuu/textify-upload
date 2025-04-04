
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { v4 as uuidv4 } from 'uuid';
import { useOcrExtraction } from "@/hooks/useOcrExtraction";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/imageDataParser";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useImageStats } from "@/hooks/useImageStats";
import { getImageHash } from "@/utils/imageHash";
import { useAuth } from '@/contexts/AuthContext';
import { useFileUpload } from './useFileUpload';

export const useImageProcessing = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookmarkletStats, setBookmarkletStats] = useState<{ total: number; processed: number; skipped: number; errors: number; }>({ total: 0, processed: 0, skipped: 0, errors: 0 });
  const [processingProgress, setProcessingProgress] = useState<{ total: number; current: number; errors: number; }>({ total: 0, current: 0, errors: 0 });
  
  // وظائف للتعامل مع الصور المحفوظة
  const { markImageAsProcessed, incrementImageStats, clearImageStats, clearProcessedImagesCache } = useImageStats();
  
  // وظيفة لحساب عدد الصور المكررة
  const countDuplicateImages = (newImage: ImageData, allImages: ImageData[]): number => {
    return allImages.filter(img => img.imageHash === newImage.imageHash).length;
  };
  
  // وظيفة للتحقق من وجود صورة مكررة
  const isDuplicateImage = (newImage: ImageData, allImages: ImageData[]): boolean => {
    return allImages.some(img => img.imageHash === newImage.imageHash);
  };
  
  // وظيفة لحذف الصور المكررة
  const removeDuplicates = () => {
    const uniqueImages: ImageData[] = [];
    const seenHashes = new Set<string>();
    
    for (const image of sessionImages) {
      if (!seenHashes.has(image.imageHash as string)) {
        uniqueImages.push(image);
        seenHashes.add(image.imageHash as string);
      }
    }
    
    setSessionImages(uniqueImages);
    toast({
      title: "تم التنظيف",
      description: "تم حذف الصور المكررة بنجاح",
    });
  };
  
  // وظيفة لإضافة صورة جديدة
  const addImage = useCallback((image: ImageData) => {
    setSessionImages(prevImages => [...prevImages, image]);
  }, []);
  
  // وظيفة لتحديث صورة موجودة
  const updateImage = useCallback((id: string, updates: Partial<ImageData>) => {
    setSessionImages(prevImages =>
      prevImages.map(img => (img.id === id ? { ...img, ...updates } : img))
    );
  }, []);
  
  // وظيفة لحذف صورة
  const deleteImage = useCallback((id: string) => {
    setSessionImages(prevImages => prevImages.filter(img => img.id !== id));
    return true; // إرجاع قيمة لحل المشكلة في Records.tsx
  }, []);
  
  // وظيفة لمسح جميع الصور
  const clearSessionImages = useCallback(() => {
    setSessionImages([]);
  }, []);
  
  // تنسيق التاريخ
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ar-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // تحميل صور المستخدم
  const loadUserImages = useCallback(async () => {
    if (!user) {
      console.log("المستخدم غير مسجل الدخول");
      return;
    }
    
    try {
      const response = await fetch(`/api/images?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // تحويل التواريخ من ISO string إلى Date object
      const imagesWithDateObjects = data.map((image: any) => ({
        ...image,
        created_at: image.created_at,
        date: new Date(image.date) // تحويل التاريخ هنا
      }));
      
      setSessionImages(imagesWithDateObjects);
      console.log("تم تحميل صور المستخدم بنجاح");
    } catch (error) {
      console.error("فشل في تحميل صور المستخدم:", error);
      toast({
        title: "فشل في تحميل الصور",
        description: "حدث خطأ أثناء تحميل الصور. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  }, [user, toast]);
  
  // حفظ الصورة في قاعدة البيانات
  const saveImageToDatabase = async (image: ImageData) => {
    if (!user) {
      console.log("المستخدم غير مسجل الدخول");
      return;
    }
    
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...image,
          userId: user.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('تم حفظ الصورة بنجاح:', result);
      
      // تحديث حالة الصورة إلى "تم الإرسال"
      updateImage(image.id, { submitted: true });
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الصورة بنجاح",
      });
    } catch (error) {
      console.error('فشل في حفظ الصورة:', error);
      toast({
        title: "فشل في الحفظ",
        description: "حدث خطأ أثناء حفظ الصورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };
  
  // تقديم الصورة إلى API
  const handleSubmitToApi = async (imageId: string) => {
    setIsSubmitting(true);
    try {
      const image = sessionImages.find(img => img.id === imageId);
      if (!image) {
        console.error("الصورة غير موجودة:", imageId);
        return;
      }
      
      // تحديث حالة الصورة إلى "جاري الإرسال"
      updateImage(imageId, { status: "processing" }); // تصحيح من "submitting" إلى "processing"
      
      // حفظ الصورة في قاعدة البيانات
      await saveImageToDatabase(image);
      
      // تحديث حالة الصورة إلى "تم الإرسال"
      updateImage(imageId, { status: "completed" }); // تصحيح من "submitted" إلى "completed"
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الصورة بنجاح",
      });
    } catch (error) {
      console.error("خطأ في إرسال الصورة:", error);
      // تحديث حالة الصورة إلى "خطأ"
      updateImage(imageId, { status: "error" });
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الصورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // تحديث النص
  const handleTextChange = (id: string, field: string, value: string) => {
    updateImage(id, { [field]: value });
  };
  
  // تنظيف قاعدة البيانات
  const runCleanupNow = async (userId: string) => {
    try {
      const response = await fetch('/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('تم تنظيف قاعدة البيانات بنجاح:', result);
      
      toast({
        title: "تم التنظيف",
        description: "تم تنظيف قاعدة البيانات بنجاح",
      });
    } catch (error) {
      console.error('فشل في تنظيف قاعدة البيانات:', error);
      toast({
        title: "فشل في التنظيف",
        description: "حدث خطأ أثناء تنظيف قاعدة البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // إضافة وظيفة إعادة معالجة الصورة
  const reprocessImage = async (imageId: string) => {
    console.log("بدء إعادة معالجة الصورة:", imageId);
    try {
      const image = sessionImages.find(img => img.id === imageId);
      if (!image || !image.file) {
        console.error("الصورة غير موجودة أو لا تحتوي على ملف:", imageId);
        toast({
          title: "خطأ في إعادة المعالجة",
          description: "لا يمكن إعادة معالجة الصورة. الملف غير موجود.",
          variant: "destructive"
        });
        return;
      }

      // تحديث حالة الصورة إلى "جاري المعالجة"
      updateImage(imageId, { status: "processing" });
      
      // استخدام وظيفة processFiles من useFileUpload مع ملف واحد فقط
      await processFiles([image.file]);
      
      toast({
        title: "إعادة المعالجة",
        description: "تمت إعادة معالجة الصورة بنجاح",
      });
    } catch (error) {
      console.error("خطأ في إعادة معالجة الصورة:", error);
      updateImage(imageId, { status: "error" });
      toast({
        title: "خطأ في إعادة المعالجة",
        description: "حدث خطأ أثناء إعادة معالجة الصورة",
        variant: "destructive"
      });
    }
  };

  const {
    handleFileChange: processFiles,
    isProcessing,
    activeUploads,
    queueLength,
    useGemini: useGeminiOption,
    setUseGemini: setUseGeminiOption,
    pauseProcessing,
    resumeProcessing,
    clearQueue,
    clearProcessedHashesCache: clearImageCache,
    manuallyTriggerProcessingQueue: retryProcessing,
    processingError
  } = useFileUpload({
    images: sessionImages,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage: saveImageToDatabase,
    isDuplicateImage,
    removeDuplicates
  });
  
  // تعديل وظيفة handleFileChange لتقبل File[] أو FileList
  const handleFileChange = useCallback((files: File[] | FileList | null) => {
    if (!files) return;
    
    // إذا كان من نوع FileList، حوله إلى مصفوفة
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    console.log("معالجة الملفات:", fileArray.length, "ملف");
    
    // ثم استدعاء الدالة من useFileUpload
    processFiles(fileArray);
  }, [processFiles]);
  
  return {
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    clearSessionImages,
    loadUserImages,
    runCleanupNow,
    saveProcessedImage: saveImageToDatabase,
    activeUploads,
    queueLength,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    clearImageCache,
    useGemini: useGeminiOption,
    processingError,
    reprocessImage
  };
};
