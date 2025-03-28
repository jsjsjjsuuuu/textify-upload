import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useDataFormatting } from "@/hooks/useDataFormatting";
import { createReliableBlobUrl } from "@/lib/gemini/utils";
import { saveToLocalStorage } from "@/utils/bookmarklet/storage";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { compressImage, enhanceImageForOCR } from "@/utils/imageCompression";
import { enhancePhoneNumber, formatIraqiPhoneNumber } from "@/utils/phoneNumberUtils";

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
}

// تعديل عدد التحميلات المتزامنة لتقليل الضغط على API
const MAX_CONCURRENT_UPLOADS = 2; // تقليل العدد من 3 إلى 2
const MAX_RETRIES = 3;           // زيادة عدد المحاولات
const RETRY_DELAY_MS = 3000;     // إضافة تأخير بين المحاولات
const PROGRESS_UPDATE_INTERVAL = 1000; // تحديث تقدم العملية كل ثانية

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0); 
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { formatPhoneNumber, formatPrice } = useDataFormatting();

  // وظيفة جديدة لرفع الصورة إلى Supabase Storage
  const uploadImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      // ضغط الصورة قبل التحميل للتخزين
      const compressedFile = await compressImage(file);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      const storagePath = `${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('receipt_images')
        .upload(storagePath, compressedFile);
      
      if (error) {
        console.error("خطأ في رفع الصورة إلى التخزين:", error);
        return null;
      }

      return storagePath;
    } catch (error) {
      console.error("خطأ أثناء رفع الصورة:", error);
      return null;
    }
  };

  // إضافة تأخير للمحاولات المتكررة
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // معالجة ملف واحد - مع تحسينات إضافية للتعامل مع الأخطاء
  const processFile = async (
    file: File, 
    startingNumber: number, 
    index: number, 
    batchId: string, 
    retryCount = 0
  ): Promise<boolean> => {
    // تعريف imageId خارج كتلة try لضمان وصول جميع أجزاء الكود إليه
    const imageId = crypto.randomUUID();
    let tempPreviewUrl: string | null = null;
    
    try {
      console.log(`معالجة الملف [${index}]: ${file.name}, النوع: ${file.type}, المحاولة: ${retryCount + 1}`);
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: `الملف "${file.name}" ليس صورة، تم تخطيه`,
          variant: "destructive"
        });
        console.log("الملف ليس صورة، تخطي");
        return false;
      }
      
      // تحسين الصورة للتعرف على النصوص
      const enhancedFile = await enhanceImageForOCR(file);
      console.log(`تم تحسين الصورة: ${file.name}, الحجم قبل: ${(file.size / 1024).toFixed(2)}KB, بعد: ${(enhancedFile.size / 1024).toFixed(2)}KB`);
      
      // إنشاء عنوان URL مؤقت للعرض المبدئي
      tempPreviewUrl = createReliableBlobUrl(enhancedFile);
      console.log("تم إنشاء عنوان URL مؤقت للمعاينة:", tempPreviewUrl?.substring(0, 50) + "...");
      
      if (!tempPreviewUrl) {
        toast({
          title: "خطأ في تحميل الصورة",
          description: `فشل في إنشاء معاينة للصورة "${file.name}"`,
          variant: "destructive"
        });
        return false;
      }
      
      // إضافة الصورة إلى القائمة أولاً مع حالة "processing" لعرض العملية للمستخدم
      const newImage: ImageData = {
        id: imageId,
        file: enhancedFile,
        previewUrl: tempPreviewUrl,
        extractedText: "جاري تحميل الصورة وتحسينها...",
        date: new Date(),
        status: "processing",
        number: startingNumber + index,
        user_id: user.id,
        batch_id: batchId,
        retryCount: retryCount
      };
      
      addImage(newImage);
      console.log("تمت إضافة صورة جديدة إلى الحالة بالمعرف:", newImage.id);
      
      // رفع الصورة إلى Supabase Storage
      const storagePath = await uploadImageToStorage(enhancedFile, user.id);
      console.log("تم رفع الصورة إلى التخزين، المسار:", storagePath);
      
      if (!storagePath) {
        updateImage(imageId, {
          status: "error",
          extractedText: "فشل في تخزين الصورة على الخادم"
        });
        
        toast({
          title: "خطأ في رفع الصورة",
          description: `فشل في تخزين الصورة "${file.name}" على الخادم`,
          variant: "destructive"
        });
        return false;
      }
      
      // الحصول على رابط URL العام للصورة
      const { data: publicUrlData } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(storagePath);
      
      const previewUrl = publicUrlData.publicUrl;
      
      // تحديث الصورة بمعلومات التخزين
      updateImage(imageId, {
        previewUrl,
        storage_path: storagePath,
        extractedText: "جاري معالجة الصورة واستخراج البيانات..."
      });
      
      // تأخير صغير قبل معالجة الصورة لتقليل الحمل
      await delay(500);
      
      try {
        // استخدام Gemini للمعالجة
        console.log(`استخدام Gemini API للاستخراج للصورة ${file.name}`);
        
        const processedImage = await processWithGemini(enhancedFile, {
          ...newImage,
          previewUrl,
          storage_path: storagePath
        });
        
        // تنظيف وتحسين رقم الهاتف تلقائيًا بعد المعالجة
        if (processedImage.phoneNumber) {
          const originalPhone = processedImage.phoneNumber;
          
          // استخدام الدالة المحسنة لتنسيق رقم الهاتف
          processedImage.phoneNumber = formatIraqiPhoneNumber(originalPhone);
          
          // تحسين رقم الهاتف باستخدام سياق النص المستخرج
          processedImage.phoneNumber = enhancePhoneNumber(
            processedImage.phoneNumber, 
            processedImage.extractedText || ""
          );
          
          if (originalPhone !== processedImage.phoneNumber) {
            console.log(`تم تنظيف رقم الهاتف تلقائيًا بعد المعالجة: "${originalPhone}" -> "${processedImage.phoneNumber}"`);
          }
        }
        
        // تحديث حالة الصورة إلى "مكتملة" إذا كانت تحتوي على جميع البيانات الأساسية
        if (processedImage.code && processedImage.senderName && processedImage.phoneNumber) {
          processedImage.status = "completed";
        } else if (processedImage.status !== "error") {
          processedImage.status = "pending";
        }
        
        // إضافة معلومات إضافية
        processedImage.user_id = user.id;
        processedImage.storage_path = storagePath;
        processedImage.retryCount = retryCount;
        
        // تحديث الصورة بالبيانات المستخرجة
        updateImage(imageId, processedImage);
        console.log("تم تحديث الصورة بالبيانات المستخرجة:", imageId);
        
        return true;
      } catch (processingError: any) {
        console.error(`خطأ في معالجة الصورة ${file.name}:`, processingError);
        
        // التحقق من نوع الخطأ
        const errorMessage = processingError.message || "خطأ غير معروف";
        
        // التحقق من وجود أخطاء تتعلق بحصة API
        const isQuotaError = errorMessage.includes('quota') || 
                            errorMessage.includes('rate limit') || 
                            errorMessage.includes('too many requests');
        
        // زيادة التأخير في حالة أخطاء الحصة
        if (isQuotaError) {
          await delay(RETRY_DELAY_MS * 2); // تأخير أطول لأخطاء الحصة
        }
        
        // إعادة المحاولة إذا كان عدد المحاولات أقل من الحد الأقصى
        if (retryCount < MAX_RETRIES) {
          const nextRetryDelay = isQuotaError ? RETRY_DELAY_MS * 3 : RETRY_DELAY_MS;
          
          console.log(`إعادة محاولة معالجة الصورة ${file.name} بعد ${nextRetryDelay}ms (${retryCount + 1}/${MAX_RETRIES})`);
          
          // تحديث حالة الصورة إلى "جاري إعادة المحاولة"
          updateImage(imageId, { 
            status: "pending",
            extractedText: `فشل في المحاولة ${retryCount + 1}. جاري إعادة المحاولة بعد ${nextRetryDelay / 1000} ثوانٍ...`
          });
          
          // إعادة المحاولة بعد تأخير
          await delay(nextRetryDelay);
          
          return await processFile(file, startingNumber, index, batchId, retryCount + 1);
        }
        
        // إذا استنفدت جميع المحاولات، حدّث الحالة إلى "خطأ"
        const friendlyErrorMessage = getFriendlyErrorMessage(errorMessage);
        
        updateImage(imageId, { 
          status: "error",
          extractedText: `فشل في المعالجة بعد ${MAX_RETRIES + 1} محاولات. ${friendlyErrorMessage}`
        });
        
        toast({
          title: "فشل في استخراج النص",
          description: `فشل في معالجة الصورة "${file.name}" بعد ${MAX_RETRIES + 1} محاولات.`,
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error: any) {
      console.error(`خطأ عام في عملية معالجة الصورة ${file.name}:`, error);
      
      // إذا كانت الصورة قد تمت إضافتها، قم بتحديث حالتها
      if (imageId) {
        updateImage(imageId, {
          status: "error",
          extractedText: `خطأ عام: ${error.message || "خطأ غير معروف"}`
        });
      }
      
      return false;
    }
  };

  // تحويل رسائل الخطأ التقنية إلى رسائل ودية للمستخدم
  const getFriendlyErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return "تم تجاوز الحد المسموح من طلبات API. حاول مرة أخرى بعد قليل.";
    } else if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
      return "انتهت مهلة الاتصال. تأكد من استقرار اتصالك بالإنترنت.";
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return "مشكلة في الاتصال بالخادم. تأكد من اتصالك بالإنترنت.";
    } else if (errorMessage.length > 100) {
      // اختصار الرسائل الطويلة
      return errorMessage.substring(0, 100) + "...";
    }
    return errorMessage;
  };

  // تحديث تقدم المعالجة بشكل منتظم
  const updateProgress = useCallback(() => {
    if (!processingStartTime || !queueProcessing) return;
    
    const totalFiles = processingQueue.length + activeUploads;
    if (totalFiles === 0) {
      setProcessingProgress(100);
      return;
    }
    
    const completedFiles = images.filter(img => 
      img.status === "completed" || img.status === "error" || img.status === "pending"
    ).length;
    
    // حساب التقدم بناءً على عدد الملفات المكتملة
    const progress = Math.floor((completedFiles / totalFiles) * 100);
    
    // للتأكد من أن شريط التقدم لا يظل عند 0% لفترة طويلة
    if (progress === 0) {
      // عرض تقدم صناعي إذا كان قد مر وقت كافٍ
      const elapsed = Date.now() - processingStartTime;
      if (elapsed > 3000) {
        // تعيين قيمة صغيرة لإظهار أن هناك تقدمًا
        setProcessingProgress(5);
      }
    } else {
      setProcessingProgress(progress);
    }
    
    // إذا تم الانتهاء من جميع الملفات
    if (activeUploads === 0 && processingQueue.length === 0) {
      setProcessingProgress(100);
      setQueueProcessing(false);
      setIsProcessing(false);
      setProcessingStartTime(null);
    }
  }, [processingStartTime, queueProcessing, processingQueue.length, activeUploads, images, setProcessingProgress]);

  // تنفيذ قائمة انتظار لمعالجة الصور بشكل متسلسل
  const processQueue = useCallback(async () => {
    if (processingQueue.length === 0 || queueProcessing) {
      return;
    }

    setQueueProcessing(true);
    setProcessingStartTime(Date.now());
    
    // إعداد مؤقت لتحديث التقدم
    const progressInterval = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL);
    
    try {
      // نسخة من قائمة الانتظار الحالية
      const currentQueue = [...processingQueue];
      const batchId = uuidv4(); // معرف فريد للدفعة
      const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
      
      let completedFiles = 0;
      const totalFiles = currentQueue.length;
      
      // مسح القائمة الأصلية
      setProcessingQueue([]);
      
      // تنفيذ معالجة متوازية محدودة
      let activePromises = 0;
      let currentIndex = 0;
      const results = [];

      // إعداد تحديث التقدم الأولي
      setProcessingProgress(1); // بدء بقيمة صغيرة لإظهار أن هناك تقدمًا

      while (currentIndex < totalFiles) {
        // معالجة فقط إذا كان عدد العمليات النشطة أقل من الحد الأقصى
        if (activePromises < MAX_CONCURRENT_UPLOADS) {
          const fileIndex = currentIndex++;
          const file = currentQueue[fileIndex];
          
          // زيادة عدد التحميلات النشطة
          activePromises++;
          setActiveUploads(prev => prev + 1);
          
          // تنفيذ عملية المعالجة
          processFile(file, startingNumber, fileIndex, batchId)
            .then(success => {
              results.push(success);
              completedFiles++;
              
              // تحديث تقدم المعالجة
              const progress = Math.round(completedFiles / totalFiles * 100);
              setProcessingProgress(progress);
              
              // تقليل عدد التحميلات النشطة
              activePromises--;
              setActiveUploads(prev => Math.max(0, prev - 1));
            })
            .catch(err => {
              console.error("خطأ غير متوقع في معالجة الملف:", err);
              activePromises--;
              setActiveUploads(prev => Math.max(0, prev - 1));
            });
          
          // تأخير قصير بين بدء المعالجات المتوازية لتقليل الضغط
          await delay(800);
        } else {
          // انتظار قصير إذا وصلنا إلى الحد الأقصى للتحميلات المتزامنة
          await delay(500);
        }
      }
      
      // انتظار انتهاء جميع التحميلات النشطة
      const checkComplete = async () => {
        while (activePromises > 0) {
          await delay(500);
        }
        
        console.log(`اكتملت معالجة الدفعة. ${results.filter(Boolean).length}/${totalFiles} صور تمت معالجتها بنجاح`);
        
        // التحقق من وجود قائمة انتظار جديدة بعد الانتهاء من الحالية
        if (processingQueue.length > 0) {
          setQueueProcessing(false);
          clearInterval(progressInterval);
          processQueue(); // معالجة الدفعة التالية
        } else {
          setQueueProcessing(false);
          setIsProcessing(false);
          setProcessingStartTime(null);
          clearInterval(progressInterval);
          setProcessingProgress(100);
          
          // تحديث إحصائيات التخزين
          console.log("إعادة حفظ البيانات في localStorage");
          const completedImages = images.filter(img => 
            img.status === "completed" && img.code && img.senderName && img.phoneNumber
          );
          
          if (completedImages.length > 0) {
            saveToLocalStorage(completedImages);
          }
        }
      };
      
      // ابدأ التحقق من اكتمال المعالجة
      checkComplete();
      
    } catch (error) {
      console.error("خطأ أثناء معالجة قائمة الانتظار:", error);
      clearInterval(progressInterval);
      setQueueProcessing(false);
      setIsProcessing(false);
      setProcessingStartTime(null);
    }
  }, [processingQueue, queueProcessing, images, addImage, updateImage, setProcessingProgress, saveProcessedImage, updateProgress]);

  // إضافة وظيفة لإعادة تشغيل المعالجة يدويًا
  const manuallyTriggerProcessingQueue = useCallback(() => {
    console.log("تم استدعاء إعادة تشغيل المعالجة يدويًا");
    
    // تأكد من أن هناك صورًا في قائمة الانتظار
    if (processingQueue.length === 0) {
      console.log("لا توجد صور في قائمة الانتظار للمعالجة");
      return;
    }
    
    // إعادة تعيين حالة المعالجة
    setQueueProcessing(false);
    
    // استدعاء وظيفة معالجة القائمة بعد تأخير قصير
    setTimeout(() => {
      processQueue();
    }, 500);
  }, [processingQueue, processQueue]);

  // استخدام useEffect لبدء معالجة القائمة عندما تتغير
  useEffect(() => {
    if (processingQueue.length > 0 && !queueProcessing) {
      processQueue();
    }
  }, [processingQueue, queueProcessing, processQueue]);

  const handleFileChange = async (files: FileList | null) => {
    console.log("معالجة الملفات:", files?.length);
    if (!files || files.length === 0) {
      console.log("لم يتم اختيار ملفات");
      return;
    }
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً لرفع الصور",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    console.log("معالجة", fileArray.length, "ملفات");
    
    // التحقق من الملفات المكررة
    const uniqueFiles = fileArray.filter(file => {
      const isDuplicate = images.some(img => img.file.name === file.name);
      if (isDuplicate) {
        console.log("تم تخطي صورة مكررة:", file.name);
      }
      return !isDuplicate;
    });
    
    if (uniqueFiles.length < fileArray.length) {
      toast({
        title: "تم تخطي الصور المكررة",
        description: `تم تخطي ${fileArray.length - uniqueFiles.length} صور مكررة`,
        variant: "default"
      });
    }
    
    if (uniqueFiles.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    // إضافة الملفات الجديدة إلى قائمة الانتظار
    setProcessingQueue(prev => [...prev, ...uniqueFiles]);
    
    // بدء المعالجة تلقائيًا من خلال useEffect
    if (!queueProcessing) {
      // تعيين قيمة صغيرة لإظهار أن العملية بدأت
      setProcessingProgress(1);
    } else {
      toast({
        title: "تمت إضافة الصور إلى قائمة الانتظار",
        description: `تمت إضافة ${uniqueFiles.length} صور إلى قائمة المعالجة`
      });
    }
  };

  // نقوم بإرجاع manuallyTriggerProcessingQueue كجزء من واجهة الاستخدام
  return {
    isProcessing,
    useGemini: true, // قيمة ثابتة لاستخدام Gemini دائمًا
    handleFileChange,
    activeUploads,
    queueLength: processingQueue.length,
    manuallyTriggerProcessingQueue
  };
};
