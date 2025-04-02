
import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/store/imageStore";
import { ImageData } from "@/types/ImageData";
import { useGeminiProcessing } from "./useGeminiProcessing";

/**
 * هوك مخصص لإدارة رفع الصور ومعالجتها
 */
export const useFileUpload = () => {
  const { toast } = useToast();
  const { images, setImages, addImage, updateImage, removeImage, clearImages } = useImageStore();
  const [isUploading, setIsUploading] = useState(false);
  const [processingImage, setProcessingImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [geminiProcessingError, setGeminiProcessingError] = useState<string | null>(null);
  const geminiProcessing = useGeminiProcessing();
  const geminiProcessingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // تعريف دالة processImages لإصلاح خطأ الاستخدام قبل التعريف
  const processImages = useCallback(async () => {
    if (geminiProcessingRef.current) {
      console.log("Gemini processing is already running, skipping...");
      return;
    }

    const pendingOrErrorImages = images.filter(img => img.status === "pending" || img.status === "error");

    if (pendingOrErrorImages.length === 0) {
      console.log("No pending or error images to process.");
      return;
    }
    
    try {
      // تغيير استدعاء الوظائف المفقودة
      for (const image of pendingOrErrorImages) {
        if (geminiProcessingRef.current) break;
        
        try {
          // استبدال الوظائف المفقودة بالوظائف المتاحة
          setIsProcessing(true);
          setProcessingImage(image.id);
          await geminiProcessing.processImage(image);
        } catch (error) {
          console.error(`خطأ في معالجة الصورة ${image.id}:`, error);
        }
      }
      setIsProcessing(false);
      setProcessingImage(null);
    } catch (error: any) {
      console.error("Error processing images:", error);
      setGeminiProcessingError(`حدث خطأ أثناء معالجة الصور: ${error.message}`);
      toast({
        title: "خطأ في معالجة الصور",
        description: `حدث خطأ أثناء معالجة الصور: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [geminiProcessing, images, setProcessingImage, toast]);

  /**
   * دالة لمعالجة الصور المرفوعة
   */
  const handleImageUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const newImages: ImageData[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = uuidv4();
        const previewUrl = URL.createObjectURL(file);

        const newImage: ImageData = {
          id: id,
          file: file,
          previewUrl: previewUrl,
          status: "pending",
          uploadedDate: new Date(),
          date: new Date(),
          extractedText: "",
          bookmarkletMessage: "",
          extractionMethod: "none", // تم تصحيح هذا من "none" إلى النوع الصحيح
          extractionSuccess: false,
          confidence: 0,
          code: "",
          senderName: "",
          phoneNumber: "",
          province: "",
          companyName: "",
          price: "",
          recipientName: "",
          notes: "",
          delegateName: "",
          packageType: "",
          pieceCount: ""
        };

        newImages.push(newImage);
        addImage(newImage);
      }

      toast({
        title: "تم رفع الصور بنجاح",
        description: `تم رفع ${files.length} صورة بنجاح`,
      });

      // بدء معالجة الصور تلقائيًا بعد الرفع
      processImages();
    } catch (error: any) {
      console.error("Error uploading images:", error);
      setUploadError(`حدث خطأ أثناء رفع الصور: ${error.message}`);
      toast({
        title: "خطأ في رفع الصور",
        description: `حدث خطأ أثناء رفع الصور: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [addImage, processImages, toast]);

  /**
   * دالة لحذف صورة
   */
  const handleImageDelete = useCallback((id: string) => {
    removeImage(id);
    toast({
      title: "تم حذف الصورة",
      description: "تم حذف الصورة بنجاح",
    });
  }, [removeImage, toast]);

  /**
   * دالة لمسح جميع الصور
   */
  const handleClearImages = useCallback(() => {
    clearImages();
    toast({
      title: "تم مسح جميع الصور",
      description: "تم مسح جميع الصور بنجاح",
    });
  }, [clearImages, toast]);

  /**
   * دالة لتحديث بيانات الصورة
   */
  const handleImageUpdate = useCallback((id: string, data: Partial<ImageData>) => {
    updateImage(id, data);
  }, [updateImage]);

  // إضافة الدوال التي يتم استخدامها في useImageProcessingCore
  const manuallyTriggerProcessingQueue = useCallback(() => {
    return processImages();
  }, [processImages]);

  const clearProcessedHashesCache = useCallback(() => {
    console.log("مسح ذاكرة التخزين المؤقت لهاشات الصور المعالجة");
    // يمكن إضافة منطق مسح الذاكرة هنا إذا لزم الأمر
  }, []);

  const pauseProcessing = useCallback(() => {
    geminiProcessingRef.current = true;
    console.log("تم إيقاف معالجة الصور مؤقتًا");
    setIsProcessing(false);
    return true;
  }, []);

  const clearQueue = useCallback(() => {
    geminiProcessingRef.current = true;
    console.log("تم مسح قائمة انتظار معالجة الصور");
    // إعادة تعيين بعد فترة قصيرة
    setTimeout(() => {
      geminiProcessingRef.current = false;
    }, 1000);
    return true;
  }, []);

  // معلومات حدود التحميل
  const uploadLimitInfo = {
    subscription: 'standard',
    dailyLimit: 3,
    currentCount: 0,
    remainingUploads: 3
  };

  // إضافة دالة handleFileChange كواجهة بديلة لـ handleImageUpload
  const handleFileChange = useCallback((files: FileList) => {
    return handleImageUpload(files);
  }, [handleImageUpload]);

  // تحديد عدد الصور النشطة في المعالجة
  const activeUploads = isProcessing ? 1 : 0;
  
  // تحديد طول قائمة الانتظار
  const queueLength = images.filter(img => img.status === "pending").length;

  // إعداد استخدام Gemini
  const useGemini = true;

  return {
    images,
    isUploading,
    processingImage,
    uploadError,
    geminiProcessingError,
    handleImageUpload,
    handleFileChange,
    handleImageDelete: removeImage,
    handleClearImages: clearImages,
    handleImageUpdate: updateImage,
    processImages,
    isProcessing,
    manuallyTriggerProcessingQueue,
    clearProcessedHashesCache,
    pauseProcessing,
    clearQueue,
    uploadLimitInfo,
    activeUploads,
    queueLength,
    useGemini
  };
};
