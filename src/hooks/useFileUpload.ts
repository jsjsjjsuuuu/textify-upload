
import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { useImageStore } from "@/store/imageStore";
import { ImageData } from "@/types/ImageData";
import { useGeminiProcessing } from "./useGeminiProcessing";
import { useSupabaseStorage } from "./useSupabaseStorage";
import { useAuth } from "@/contexts/AuthContext";

/**
 * هوك مخصص لإدارة رفع الصور ومعالجتها
 */
export const useFileUpload = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { images, addImage, updateImage, removeImage, clearImages } = useImageStore();
  const [isUploading, setIsUploading] = useState(false);
  const [processingImage, setProcessingImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [geminiProcessingError, setGeminiProcessingError] = useState<string | null>(null);
  const geminiProcessing = useGeminiProcessing();
  const supabaseStorage = useSupabaseStorage();
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
    
    // تعيين معالجة Gemini كنشطة
    geminiProcessingRef.current = true;
    
    try {
      let processedCount = 0;
      const totalImages = pendingOrErrorImages.length;
      
      // معالجة الصور واحدة تلو الأخرى
      for (const image of pendingOrErrorImages) {
        if (!geminiProcessingRef.current) break; // التحقق مما إذا تم إيقاف المعالجة
        
        try {
          setIsProcessing(true);
          setProcessingImage(image.id);
          
          // تحديث حالة الصورة إلى "processing"
          updateImage(image.id, { status: "processing" });
          
          // رفع الصورة إلى Supabase إذا لم تكن مرفوعة بالفعل
          if (user && !image.storage_path && image.file) {
            const uploadResult = await supabaseStorage.uploadImageToStorage(
              image.file,
              user.id,
              image.batch_id || 'default'
            );
            
            if (uploadResult.success && uploadResult.path) {
              // تحديث الصورة بمسار التخزين
              updateImage(image.id, { storage_path: uploadResult.path });
              
              // تحديث الصورة التي سيتم معالجتها بمسار التخزين
              image.storage_path = uploadResult.path;
            }
          }
          
          // معالجة الصورة باستخدام Gemini
          await geminiProcessing.processImage(image);
          
          // تحديث نسبة التقدم
          processedCount++;
          const progress = Math.round((processedCount / totalImages) * 100);
          setProcessingProgress(progress);
          
        } catch (error) {
          console.error(`خطأ في معالجة الصورة ${image.id}:`, error);
          updateImage(image.id, { 
            status: "error", 
            bookmarkletMessage: `فشل المعالجة: ${error.message || "خطأ غير معروف"}`
          });
        }
      }
      
      // إعادة تعيين الحالة بعد الانتهاء
      setIsProcessing(false);
      setProcessingImage(null);
      setProcessingProgress(100);
      
      // تأخير صغير قبل إعادة تعيين التقدم
      setTimeout(() => {
        setProcessingProgress(0);
      }, 1000);
      
    } catch (error: any) {
      console.error("Error processing images:", error);
      setGeminiProcessingError(`حدث خطأ أثناء معالجة الصور: ${error.message}`);
      toast({
        title: "خطأ في معالجة الصور",
        description: `حدث خطأ أثناء معالجة الصور: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // إعادة تعيين حالة المعالجة
      geminiProcessingRef.current = false;
      setIsProcessing(false);
      setProcessingImage(null);
    }
  }, [geminiProcessing, images, updateImage, toast, user, supabaseStorage.uploadImageToStorage]);

  /**
   * دالة لمعالجة الصور المرفوعة
   */
  const handleImageUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const batchId = uuidv4(); // إنشاء معرف دفعة للصور المرفوعة معًا
      const newImages: ImageData[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = uuidv4();
        const previewUrl = URL.createObjectURL(file);

        const newImage: ImageData = {
          id: id,
          file: file,
          fileName: file.name, // حفظ اسم الملف
          previewUrl: previewUrl,
          status: "pending",
          uploadedDate: new Date(),
          date: new Date(),
          extractedText: "",
          extractionMethod: "none",
          batch_id: batchId,
          bookmarkletMessage: "",
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
        description: `تم رفع ${files.length} صورة بنجاح، وسيتم معالجتها تلقائيًا`,
      });

      // بدء معالجة الصور تلقائيًا بعد الرفع
      setTimeout(() => {
        processImages();
      }, 500);
      
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
  const handleImageDelete = useCallback(async (id: string) => {
    // الحصول على الصورة قبل حذفها
    const imageToDelete = images.find(img => img.id === id);
    
    if (imageToDelete && imageToDelete.storage_path) {
      // محاولة حذف الملف من التخزين أولاً إذا كان موجودًا
      await supabaseStorage.deleteImageFromStorage(imageToDelete.storage_path);
    }
    
    // حذف الصورة من الحالة المحلية
    removeImage(id);
    
    // حذف أي مصادر للكائنات URL
    if (imageToDelete && imageToDelete.previewUrl) {
      URL.revokeObjectURL(imageToDelete.previewUrl);
    }
    
    toast({
      title: "تم حذف الصورة",
      description: "تم حذف الصورة بنجاح",
    });
  }, [removeImage, toast, images, supabaseStorage]);

  /**
   * دالة لمسح جميع الصور
   */
  const handleClearImages = useCallback(() => {
    // حذف جميع مصادر URL للكائنات قبل المسح
    images.forEach(img => {
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    
    clearImages();
    toast({
      title: "تم مسح جميع الصور",
      description: "تم مسح جميع الصور بنجاح",
    });
  }, [clearImages, toast, images]);

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
    geminiProcessingRef.current = false;
    console.log("تم إيقاف معالجة الصور مؤقتًا");
    setIsProcessing(false);
    return true;
  }, []);

  const clearQueue = useCallback(() => {
    geminiProcessingRef.current = false;
    console.log("تم مسح قائمة انتظار معالجة الصور");
    // إعادة تعيين الصور المعلقة إلى "pending"
    images.forEach(img => {
      if (img.status === "processing") {
        updateImage(img.id, { status: "pending" });
      }
    });
    
    // إعادة تعيين بعد فترة قصيرة
    setTimeout(() => {
      geminiProcessingRef.current = false;
    }, 1000);
    return true;
  }, [images, updateImage]);

  // معلومات حدود التحميل
  const uploadLimitInfo = user?.subscription_plan ? {
    subscription: user.subscription_plan,
    dailyLimit: user.subscription_plan === 'pro' ? 3500 : 
                user.subscription_plan === 'vip' ? 1600 : 3,
    currentCount: 0, // يمكن تحديثها من قاعدة البيانات
    remainingUploads: user.subscription_plan === 'pro' ? 3500 : 
                      user.subscription_plan === 'vip' ? 1600 : 3
  } : {
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
    processingProgress,
    uploadError,
    geminiProcessingError,
    handleImageUpload,
    handleFileChange,
    handleImageDelete,
    handleClearImages,
    handleImageUpdate,
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
