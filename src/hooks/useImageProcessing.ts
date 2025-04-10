import { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "@/types/ImageData";
import { useAuth } from "@/contexts/AuthContext";
import { useOcrProcessing } from "./useOcrProcessing";
import { useGeminiProcessing } from "./useGeminiProcessing";
import { useFileUpload } from "./useFileUpload";
import { formatDate } from "@/utils/dateFormatter";
import { useImageDatabase } from "./useImageDatabase";
import { useToast } from "./use-toast";
import { useDuplicateDetection } from "./useDuplicateDetection";
import { useDataExtraction } from "./useDataExtraction";
import { useSavedImageProcessing } from "./useSavedImageProcessing";
import { useImageState } from "./useImageState";

export const useImageProcessing = () => {
  // إعادة تصدير دالة formatDate لاستخدامها في المكونات
  const formatDateFn = formatDate;

  // توابع المعالجة الرئيسية من الهوكس الخاصة
  const { user } = useAuth();
  const { toast } = useToast();
  
  // استيراد الهوكس
  const { 
    images, 
    updateImage, 
    deleteImage, 
    addImage, 
    clearSessionImages,
    clearImages,
    handleTextChange
  } = useImageState();
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  const { handleFileChange: fileUploadHandler } = useFileUpload({
    addImage,
    updateImage,
    setProcessingProgress: (progress: number) => setProcessingProgress(progress)
  });
  
  // حالة معالجة الصور
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [imageQueue, setImageQueue] = useState<File[]>([]);
  
  // استيراد هوك قاعدة البيانات مع تمرير دالة updateImage
  const { loadUserImages: fetchUserImages, saveImageToDatabase, handleSubmitToApi: submitToApi, deleteImageFromDatabase, runCleanupNow } = useImageDatabase(updateImage);
  
  // هوك كشف التكرارات
  const { isDuplicateImage } = useDuplicateDetection();

  // تحميل الصور السابقة
  useEffect(() => {
    if (user) {
      fetchUserImages(user.id, (loadedImages) => {
        // إضافة الصور المحملة للصور الحالية
        const updatedImages = [...loadedImages];
        setImages(updatedImages);
      });
    }
  }, [user]);

  // معالجة ملف واحد من القائمة
  const processNextFile = useCallback(async () => {
    if (imageQueue.length === 0 || isPaused) {
      // تم الانتهاء من معالجة الصور أو تم إيقاف المعالجة مؤقتًا
      setIsProcessing(false);
      setProcessingProgress(100);
      setActiveUploads(0);
      return;
    }

    // أخذ أول ملف من القائمة
    const file = imageQueue[0];
    setImageQueue((prevQueue) => prevQueue.slice(1)); // إزالة الملف من القائمة
    setActiveUploads(1); // تحديث عدد الملفات قيد المعالجة

    // تحقق من التكرار - تعديل التوقيع بإضافة وسيط ثانٍ فارغ
    const imageObj: ImageData = {
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      date: new Date(),
      status: "pending",
      user_id: user?.id,
      batch_id: uuidv4()
    };
    
    if (isDuplicateImage(imageObj, [])) {
      console.log("تم اكتشاف ملف مكرر:", file.name);
      toast({
        title: "ملف مكرر",
        description: `تم تجاهل "${file.name}" لأنه موجود بالفعل`,
        variant: "destructive"
      });
      
      // المعالجة التالية
      processNextFile();
      return;
    }

    try {
      // إنشاء معرّف فريد للصورة
      const id = uuidv4();
      const batchId = uuidv4(); // يمكن استخدامه لتجميع الصور المرتبطة

      // تهيئة كائن الصورة
      const imageData: ImageData = {
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        date: new Date(),
        status: "pending",
        user_id: user?.id,
        batch_id: batchId
      };

      // إضافة الصورة إلى القائمة
      addImage(imageData);

      // معالجة الصورة باستخدام OCR
      updateImage(id, { status: "processing" });
      
      // استخدام processWithOcr بدلاً من processImages
      const processedImage = await processWithOcr(file, imageData);
      const extractedText = processedImage.extractedText || '';

      // تحميل الصورة إلى التخزين إذا كان هناك مستخدم
      let storagePath = null;
      if (user) {
        storagePath = `images/${user.id}/${id}-${file.name}`;
        // سنستخدم uploadService لتحميل الملفات
        // لا يمكننا استدعاء uploadImage مباشرة
      }

      // التعرف على النص باستخدام OCR
      if (!extractedText) {
        throw new Error("لم يتم استخراج أي نص من الصورة");
      }

      // هنا كان يستخدم دالة استخراج البيانات التي لم تعد موجودة
      // نستخدم بدلاً منها التحديث المباشر للصورة
      
      // تحديث الصورة بالنص المستخرج والبيانات المحللة
      updateImage(id, { 
        extractedText,
        status: "completed",
        storage_path: storagePath,
      });

      // حفظ في قاعدة البيانات إذا كان هناك مستخدم
      if (user && extractedText) {
        const updatedImageData = images.find((img) => img.id === id);
        if (updatedImageData) {
          await saveImageToDatabase(updatedImageData);
        }
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      // تحديث التقدم
      const progress = Math.min(100, ((queueLength - imageQueue.length) / queueLength) * 100);
      setProcessingProgress(progress);
      
      // معالجة الملف التالي
      processNextFile();
    }
  }, [imageQueue, isPaused, user, images, addImage, updateImage, toast, processWithOcr, isDuplicateImage, queueLength, saveImageToDatabase]);

  // إعادة تصدير بعض الدوال المفيدة
  const handleFileChange = (files: FileList | File[]) => {
    fileUploadHandler(files);
    setProcessingProgress(0);
  };

  const handleDelete = async (id: string) => {
    try {
      if (user) {
        await deleteImageFromDatabase(id);
      }
      deleteImage(id);
      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  };

  const setImages = (newImages: ImageData[]) => {
    // استخدام العمليات المتاحة في useImageState
    clearImages();
    newImages.forEach(img => addImage(img));
  };
  
  // إضافة isLoadingUserImages للتصدير
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);

  // تعديل وظيفة loadUserImages لتعكس حالة التحميل
  const loadUserImages = (callback?: (images: ImageData[]) => void) => {
    if (user) {
      setIsLoadingUserImages(true);
      // استدعاء دالة fetchUserImages من useImageDatabase مع تمرير معرف المستخدم ودالة الرجوع
      return fetchUserImages(user.id, (loadedImages) => {
        setIsLoadingUserImages(false);
        if (callback) {
          callback(loadedImages);
        } else {
          setImages(loadedImages);
        }
      });
    }
  };

  /**
   * معالجة إرسال الصورة إلى API - تمثل واجهة مبسطة لـ handleSubmitToApi
   * @param id - معرف الصورة المراد إرسالها
   */
  const handleSubmitToApi = async (id: string) => {
    try {
      // تحديث حالة التقديم
      setIsSubmitting(prev => ({ ...prev, [id]: true }));
      
      // البحث عن الصورة المقابلة
      const image = images.find(img => img.id === id);
      
      if (!image) {
        throw new Error(`الصورة ذات المعرف ${id} غير موجودة`);
      }
      
      // استدعاء دالة submitToApi مع تمرير المعلومات المطلوبة
      const result = await submitToApi(id, image, user?.id);
      
      // تحديث حالة الصورة إذا كان الإرسال ناجحًا
      if (result) {
        updateImage(id, { submitted: true });
      }
      
      return result;
    } catch (error) {
      console.error("Error submitting image:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      // إعادة تعيين حالة التقديم
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };
  
  // تنفيذ الوظائف الناقصة
  const retryProcessing = () => {
    // إعادة معالجة الصور التي فشلت
    toast({
      title: "إعادة المحاولة",
      description: "جاري إعادة معالجة الصور التي فشلت",
    });
  };
  
  const pauseProcessing = () => {
    // إيقاف/استئناف المعالجة
    setIsPaused(prev => !prev);
    toast({
      title: isPaused ? "استئناف" : "إيقاف مؤقت",
      description: isPaused ? "تم استئناف معالجة الصور" : "تم إيقاف معالجة الصور مؤقتًا",
    });
  };
  
  const clearQueue = () => {
    // إفراغ قائمة الانتظار
    setImageQueue([]);
    setQueueLength(0);
    toast({
      title: "تم إفراغ القائمة",
      description: "تم إفراغ قائمة انتظار الصور",
    });
  };

  // في هذا الجزء، نضيف وظيفة جديدة لمسح مفتاح API القديم من localStorage
  const clearOldApiKey = useCallback(() => {
    const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8"; // المفتاح القديم
    const storedApiKey = localStorage.getItem("geminiApiKey");
    
    if (storedApiKey === oldApiKey) {
      console.log("تم اكتشاف مفتاح API قديم. جاري المسح...");
      localStorage.removeItem("geminiApiKey");
      
      // تعيين المفتاح الجديد
      const newApiKey = "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
      localStorage.setItem("geminiApiKey", newApiKey);
      
      toast({
        title: "تم تحديث مفتاح API",
        description: "تم تحديث مفتاح Gemini API بنجاح",
      });
      
      return true;
    }
    
    return false;
  }, [toast]);

  // إضافة الوظيفة الجديدة إلى الكائن المُرجع
  return {
    // البيانات
    images,
    // الحالة
    isProcessing,
    processingProgress,
    isPaused,
    isSubmitting,
    activeUploads,
    queueLength,
    isLoadingUserImages, // إضافة حالة التحميل للتصدير
    // الدوال
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate: formatDateFn,
    // إضافة الدوال الجديدة
    clearSessionImages,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    runCleanup: (userId: string) => {
      if (userId) {
        runCleanupNow(userId);
      }
    },
    // تصدير واجهة الدالة المبسطة
    loadUserImages,
    setImages,
    clearOldApiKey
  };
};
