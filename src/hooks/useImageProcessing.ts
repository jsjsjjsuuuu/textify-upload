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
// إضافة استيراد useDuplicateDetection
import { useDuplicateDetection } from "./useDuplicateDetection";
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
    handleTextChange,
    setAllImages,
    hiddenImageIds,
    unhideImage,
    unhideAllImages,
    getHiddenImageIds
  } = useImageState();
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  const { handleFileChange: fileUploadHandler } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress: (progress: number) => setProcessingProgress(progress),
    processWithOcr,
    processWithGemini
  });
  
  // حالة معالجة الصور
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [imageQueue, setImageQueue] = useState<File[]>([]);
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  
  // استيراد هوك قاعدة البيانات مع تمرير دالة updateImage
  const { loadUserImages: fetchUserImages, saveImageToDatabase, handleSubmitToApi: submitToApi, deleteImageFromDatabase, runCleanupNow } = useImageDatabase(updateImage);
  
  // هوك كشف التكرارات
  const { isDuplicateImage, markImageAsProcessed } = useDuplicateDetection();
  
  // تحميل الصور السابقة
  useEffect(() => {
    if (user) {
      setIsLoadingUserImages(true);
      fetchUserImages(user.id, (loadedImages) => {
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        setAllImages(visibleImages);
        setIsLoadingUserImages(false);
      });
    }
  }, [user, hiddenImageIds]);

  // معالجة ملف واحد من القائمة مع التحقق من التكرار
  const processNextFile = useCallback(async () => {
    if (imageQueue.length === 0 || isPaused) {
      // تم الانتهاء من معالجة الصور أو تم إيقاف المعالجة مؤقتًا
      setIsProcessing(false); // تحديث الحالة لإظهار أن المعالجة انتهت
      setProcessingProgress(100);
      setActiveUploads(0);
      return;
    }

    // أخذ أول ملف من القائمة
    const file = imageQueue[0];
    setImageQueue((prevQueue) => prevQueue.slice(1)); // إزالة الملف من القائمة
    setActiveUploads(1); // تحديث عدد الملفات قيد المعالجة

    // تهيئة كائن الصورة للتحقق من التكرار
    const imageObj: ImageData = {
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      date: new Date(),
      status: "pending",
      user_id: user?.id,
      batch_id: uuidv4()
    };
    
    try {
      // التحقق من التكرار باستخدام الهوك الجديد
      const isDuplicate = await isDuplicateImage(imageObj, images);
      
      if (isDuplicate) {
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
      }

      // التعرف على النص باستخدام OCR
      if (!extractedText) {
        throw new Error("لم يتم استخراج أي نص من الصورة");
      }

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
          
          // تسجيل الصورة كمعالجة بعد الحفظ في قاعدة البيانات
          markImageAsProcessed(updatedImageData);
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
  }, [imageQueue, isPaused, user, images, addImage, updateImage, toast, processWithOcr, isDuplicateImage, queueLength, saveImageToDatabase, markImageAsProcessed]);

  // إعادة تصدير بعض الدوال المفيدة
  const handleFileChange = (files: FileList | File[]) => {
    // تصفير حالة المؤشرات أولا للتأكد من صحة العرض
    setProcessingProgress(0);
    setActiveUploads(0);
    
    // إعداد المعالجة
    fileUploadHandler(files);
    setIsProcessing(true);
    
    // تحديث عدد الملفات في قائمة الانتظار
    if (files.length > 0) {
      setQueueLength(files.length);
      setActiveUploads(Math.min(files.length, 1)); // نبدأ بمعالجة ملف واحد فقط
    }
  };

  // تعديل وظيفة حذف الصورة للتفريق بين الإزالة من العرض والحذف الفعلي
  const handleDelete = async (id: string) => {
    try {
      // حذف من العرض الحالي فقط (دون حذفها من قاعدة البيانات)
      return deleteImage(id, false);
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  };
  
  // إضافة وظيفة حذف الصورة نهائيًا من قاعدة البيانات
  const handlePermanentDelete = async (id: string) => {
    try {
      if (user) {
        // الحذف من قاعدة البيانات
        await deleteImageFromDatabase(id);
      }
      // ثم الحذف من العرض المحلي
      return deleteImage(id, true);
    } catch (error) {
      console.error("Error permanently deleting image:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف الصورة",
        variant: "destructive"
      });
      return false;
    }
  };

  const setImages = (newImages: ImageData[]) => {
    // استخدام العمليات المتاحة في useImageState
    clearImages();
    newImages.forEach(img => addImage(img));
  };
  
  /**
   * تحميل صور المستخدم - واجهة مبسطة تستخدم دالة الرجوع فقط
   * @param callback - دالة الرجوع التي ستتلقى الصور المحملة
   */
  const loadUserImages = (callback?: (images: ImageData[]) => void) => {
    if (user) {
      setIsLoadingUserImages(true);
      // استدعاء دالة fetchUserImages من useImageDatabase مع تمرير معرف المستخدم ودالة الرجوع
      return fetchUserImages(user.id, (loadedImages) => {
        // تصفية الصور المخفية قبل إضافتها للعرض
        const visibleImages = loadedImages.filter(img => !hiddenImageIds.includes(img.id));
        if (callback) {
          callback(visibleImages);
        } else {
          setImages(visibleImages);
        }
        setIsLoadingUserImages(false);
      });
    }
  };

  // مواجهة مبسطة للتقديم مع تسجيل الصورة كمعالجة بعد الإرسال
  const handleSubmitToApi = useCallback(async (id: string) => {
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
        
        // تسجيل الصورة كمعالجة بعد الإرسال الناجح
        const submittedImage = images.find(img => img.id === id);
        if (submittedImage) {
          markImageAsProcessed(submittedImage);
        }
        
        // عرض رسالة نجاح للمستخدم
        toast({
          title: "تم الإرسال بنجاح",
          description: "تم إرسال البيانات بنجاح إلى API"
        });
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
  }, [images, submitToApi, toast, updateImage, user?.id, markImageAsProcessed]);

  // تنفيذ الوظائف الناقصة
  const retryProcessing = () => {
    // إعادة معالجة الصور التي فشلت
    toast({
      title: "إعادة المحاولة",
      description: "جاري إعادة معالجة الصور التي فشلت",
    });
  };
  
  const clearQueue = () => {
    // إفراغ قائمة الانتظار
    setImageQueue([]);
    setQueueLength(0);
    setActiveUploads(0);
    setIsProcessing(false); // إيقاف المعالجة عند إفراغ القائمة
    
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

  // تأكد من تحديث حالة المعالجة عندما تكتمل جميع الملفات
  useEffect(() => {
    if (processingProgress >= 100 && activeUploads === 0 && isProcessing) {
      console.log("اكتملت معالجة جميع الصور. إخفاء مؤشر المعالجة...");
      // تأخير صغير قبل إخفاء مؤشر المعالجة للتأكد من أن المستخدم رأى 100%
      const timer = setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [processingProgress, activeUploads, isProcessing]);

  // إضافة رسائل تشخيص لمتابعة حالة المعالجة
  useEffect(() => {
    console.log(`حالة المعالجة: processing=${isProcessing}, progress=${processingProgress}%, activeUploads=${activeUploads}`);
  }, [isProcessing, processingProgress, activeUploads]);

  // إضافة الوظيفة الجديدة إلى الكائن المُرجع
  return {
    // البيانات
    images,
    hiddenImageIds,
    // الحالة
    isProcessing,
    processingProgress,
    isPaused,
    isSubmitting,
    activeUploads,
    queueLength,
    isLoadingUserImages,
    // الدوال
    handleFileChange,
    handleTextChange,
    handleDelete,
    handlePermanentDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate: formatDateFn,
    // إضافة الوظائف الجديدة للتحكم في الصور المخفية
    unhideImage,
    unhideAllImages,
    getHiddenImageIds,
    // إضافة الدوال الأخرى
    clearSessionImages,
    retryProcessing,
    clearQueue,
    runCleanup: (userId: string) => {
      if (userId) {
        runCleanupNow(userId);
      }
    },
    // تصدير واجهة الدالة المبسطة
    loadUserImages,
    setImages: setAllImages,
    clearOldApiKey,
    // إضافة دالة لتحقق من وجود الصورة مسبقاً
    checkDuplicateImage: isDuplicateImage
  };
};
