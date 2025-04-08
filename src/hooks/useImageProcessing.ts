
// تنبيه: لا تقم بتعديل هذا الملف مباشرة، استخدم المكتبات الموجودة مثل useImageDatabase.ts

import { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "@/types/ImageData";
import { useAuth } from "@/contexts/AuthContext";
import { useOcrProcessing } from "./useOcrProcessing";
import { useGeminiProcessing } from "./useGeminiProcessing";
import { useFileUpload } from "./useFileUpload";
import { extractProvinceFromText } from "@/utils/provinceCorrection";
import { extractPhoneNumber } from "@/utils/phoneNumberUtils";
import { processExtractedText, parseExtractedTextWithGemini } from "@/utils/extractionUtils";
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
  const { images, setImages, updateImage, removeImage, addImage, clearImages } = useImageState();
  const { processImages } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  const { uploadImage } = useFileUpload();
  
  // حالة معالجة الصور
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [imageQueue, setImageQueue] = useState<File[]>([]);
  
  // استيراد هوك قاعدة البيانات مع تمرير دالة updateImage
  const { loadUserImages, saveImageToDatabase, handleSubmitToApi, deleteImageFromDatabase, runCleanupNow } = useImageDatabase(updateImage);
  
  // هوك كشف التكرارات
  const { isDuplicate } = useDuplicateDetection(images);
  
  // معالجة النصوص المستخرجة
  const { extractDataFromText } = useDataExtraction();

  // تحميل الصور السابقة
  useEffect(() => {
    if (user) {
      loadUserImages(user.id, (loadedImages) => {
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

    // تحقق من التكرار
    if (isDuplicate(file)) {
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
      const extractedText = await processImages(file);

      // تحميل الصورة إلى التخزين إذا كان هناك مستخدم
      let storagePath = null;
      if (user) {
        storagePath = `images/${user.id}/${id}-${file.name}`;
        await uploadImage(file, storagePath);
      }

      // التعرف على النص باستخدام OCR
      if (!extractedText) {
        throw new Error("لم يتم استخراج أي نص من الصورة");
      }

      // استخراج البيانات من النص المستخرج
      const parsedData = extractDataFromText(extractedText);
      
      // تحديث الصورة بالنص المستخرج والبيانات المحللة
      updateImage(id, { 
        extractedText,
        status: "completed",
        senderName: parsedData.senderName,
        phoneNumber: parsedData.phoneNumber,
        province: parsedData.province,
        price: parsedData.price,
        companyName: parsedData.companyName,
        code: parsedData.code,
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
  }, [imageQueue, isPaused, user, images]);

  // بدء معالجة الصور عندما تتغير قائمة الانتظار
  useEffect(() => {
    if (imageQueue.length > 0 && !isProcessing && !isPaused) {
      setIsProcessing(true);
      processNextFile();
    }
    
    // تحديث عدد الملفات في قائمة الانتظار
    setQueueLength(imageQueue.length);
  }, [imageQueue, isProcessing, isPaused]);

  // إعادة تصدير بعض الدوال المفيدة
  const handleFileChange = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setImageQueue((prev) => [...prev, ...fileArray]);
    setQueueLength((prev) => prev + fileArray.length);
    setProcessingProgress(0);
  };

  const handleTextChange = (id: string, field: keyof ImageData, value: string) => {
    updateImage(id, { [field]: value });
  };

  const handleDelete = async (id: string) => {
    try {
      if (user) {
        await deleteImageFromDatabase(id);
      }
      removeImage(id);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const pauseProcessing = () => {
    setIsPaused(true);
    toast({
      title: "تم إيقاف المعالجة",
      description: "تم إيقاف معالجة الصور مؤقتًا. يمكنك استئناف المعالجة في أي وقت."
    });
  };

  const retryProcessing = () => {
    setIsPaused(false);
    if (imageQueue.length > 0) {
      setIsProcessing(true);
      processNextFile();
    }
  };

  const clearQueue = () => {
    setImageQueue([]);
    setQueueLength(0);
    setIsProcessing(false);
    toast({
      title: "تم مسح قائمة الانتظار",
      description: "تم مسح قائمة انتظار معالجة الصور بنجاح."
    });
  };

  const clearSessionImages = () => {
    // حذف الصور المؤقتة التي لم يتم حفظها في قاعدة البيانات
    const tempImages = images.filter(img => img.sessionImage || !img.user_id);
    tempImages.forEach(img => {
      URL.revokeObjectURL(img.previewUrl);
    });
    
    // تحديث قائمة الصور
    const permanentImages = images.filter(img => !img.sessionImage && img.user_id);
    setImages(permanentImages);
    
    toast({
      title: "تم مسح الصور المؤقتة",
      description: "تم مسح الصور المؤقتة من الجلسة الحالية."
    });
  };

  const runCleanup = (userId: string) => {
    if (userId) {
      runCleanupNow(userId);
    }
  };

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
    runCleanup
  };
};
