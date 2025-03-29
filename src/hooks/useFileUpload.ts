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
import { generateProcessingId } from "@/utils/duplicateRemover";

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
  removeDuplicates?: () => void;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const PROGRESS_UPDATE_INTERVAL = 1000;
const MIN_DELAY_BETWEEN_IMAGES = 3000;

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage,
  removeDuplicates
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0); 
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [lastProcessedImageTime, setLastProcessedImageTime] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { processWithGemini } = useGeminiProcessing();
  const { formatPhoneNumber, formatPrice } = useDataFormatting();

  const uploadImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processFile = async (
    file: File, 
    startingNumber: number, 
    index: number, 
    batchId: string, 
    retryCount = 0
  ): Promise<boolean> => {
    const imageId = crypto.randomUUID();
    const processingId = generateProcessingId();
    let tempPreviewUrl: string | null = null;
    
    try {
      console.log(`معالجة الملف [${index}]: ${file.name}, النوع: ${file.type}, المحاولة: ${retryCount + 1}, معرف العملية: ${processingId}`);
      setCurrentProcessingIndex(index);
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: `الملف "${file.name}" ليس صورة، تم تخطيه`,
          variant: "destructive"
        });
        console.log("الملف ليس صورة، تخطي");
        return false;
      }
      
      const now = Date.now();
      const timeSinceLastProcessing = now - lastProcessedImageTime;
      if (timeSinceLastProcessing < MIN_DELAY_BETWEEN_IMAGES) {
        const waitTime = MIN_DELAY_BETWEEN_IMAGES - timeSinceLastProcessing;
        console.log(`الانتظار ${waitTime}ms بين معالجة الصور...`);
        await delay(waitTime);
      }
      setLastProcessedImageTime(Date.now());
      
      const enhancedFile = await enhanceImageForOCR(file);
      console.log(`تم تحسين الصورة: ${file.name}, الحجم قبل: ${(file.size / 1024).toFixed(2)}KB, بعد: ${(enhancedFile.size / 1024).toFixed(2)}KB`);
      
      tempPreviewUrl = createReliableBlobUrl(enhancedFile);
      
      if (!tempPreviewUrl) {
        toast({
          title: "خطأ في تحميل الصورة",
          description: `فشل في إنشاء معاينة للصورة "${file.name}"`,
          variant: "destructive"
        });
        return false;
      }
      
      const existingDuplicateImage = images.find(img => 
        (img.file.name === enhancedFile.name || img.file.name === file.name) && 
        img.status === "completed" && 
        img.code && 
        img.senderName && 
        img.phoneNumber
      );
      
      if (existingDuplicateImage) {
        console.log(`تم العثور على نسخة مكتملة المعالجة من الصورة ${file.name}, تجاهل المعالجة وإضافة نسخة جديدة من البيانات`);
        
        const newImage: ImageData = {
          id: imageId,
          file: enhancedFile,
          previewUrl: tempPreviewUrl,
          extractedText: existingDuplicateImage.extractedText,
          code: existingDuplicateImage.code,
          senderName: existingDuplicateImage.senderName,
          phoneNumber: existingDuplicateImage.phoneNumber,
          province: existingDuplicateImage.province,
          price: existingDuplicateImage.price,
          companyName: existingDuplicateImage.companyName,
          date: new Date(),
          status: "completed",
          number: startingNumber + index,
          user_id: user.id,
          batch_id: batchId,
          retryCount: 0,
          added_at: Date.now(),
          processingId: processingId,
          confidence: existingDuplicateImage.confidence,
          usedApiKey: existingDuplicateImage.usedApiKey || "clone"
        };
        
        addImage(newImage);
        console.log("تمت إضافة نسخة من البيانات المكتملة سابقاً للصورة بالمعرف:", newImage.id);
        
        return true;
      }
      
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
        retryCount: retryCount,
        added_at: Date.now(),
        processingId: processingId
      };
      
      addImage(newImage);
      console.log("تمت إضافة صورة جديدة إلى الحالة بالمعرف:", newImage.id, "ومعرف العملية:", processingId);
      
      await delay(500);
      
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
      
      const { data: publicUrlData } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(storagePath);
      
      const previewUrl = publicUrlData.publicUrl;
      
      updateImage(imageId, {
        previewUrl,
        storage_path: storagePath,
        extractedText: "جاري معالجة الصورة واستخراج البيانات..."
      });
      
      await delay(700);
      
      try {
        console.log(`استخدام Gemini API للاستخراج للصورة ${file.name}, معرف العملية: ${processingId}`);
        
        const processedImage = await processWithGemini(enhancedFile, {
          ...newImage,
          previewUrl,
          storage_path: storagePath,
          processingId: processingId
        });
        
        if (processedImage.phoneNumber) {
          const originalPhone = processedImage.phoneNumber;
          
          processedImage.phoneNumber = formatIraqiPhoneNumber(originalPhone);
          
          processedImage.phoneNumber = enhancePhoneNumber(
            processedImage.phoneNumber, 
            processedImage.extractedText || ""
          );
          
          if (originalPhone !== processedImage.phoneNumber) {
            console.log(`تم تنظيف رقم الهاتف تلقائيًا بعد المعالجة: "${originalPhone}" -> "${processedImage.phoneNumber}"`);
          }
        }
        
        if (processedImage.code && processedImage.senderName && processedImage.phoneNumber) {
          processedImage.status = "completed";
        } else if (processedImage.status !== "error") {
          processedImage.status = "pending";
        }
        
        processedImage.user_id = user.id;
        processedImage.storage_path = storagePath;
        processedImage.retryCount = retryCount;
        processedImage.added_at = Date.now();
        processedImage.processingId = processingId;
        
        updateImage(imageId, processedImage);
        console.log("تم تحديث الصورة بالبيانات المستخرجة:", imageId, "معرف العملية:", processingId);
        
        return true;
      } catch (processingError: any) {
        console.error(`خطأ في معالجة الصورة ${file.name}:`, processingError);
        
        const errorMessage = processingError.message || "خطأ غير معروف";
        
        const isQuotaError = errorMessage.includes('quota') || 
                             errorMessage.includes('rate limit') || 
                             errorMessage.includes('too many requests');
                             
        const isNetworkError = errorMessage.includes('network') || 
                               errorMessage.includes('connection') || 
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('fetch') ||
                               errorMessage.includes('ECONNREFUSED');
                               
        const isServerError = errorMessage.includes('500') || 
                              errorMessage.includes('502') || 
                              errorMessage.includes('503') || 
                              errorMessage.includes('504');
        
        let nextRetryDelay = RETRY_DELAY_MS;
        
        if (isQuotaError) {
          nextRetryDelay = RETRY_DELAY_MS * 4;
        } else if (isNetworkError) {
          nextRetryDelay = RETRY_DELAY_MS * 2;
        } else if (isServerError) {
          nextRetryDelay = RETRY_DELAY_MS * 3;
        }
        
        if (retryCount < MAX_RETRIES) {
          console.log(`إعادة محاولة معالجة الصورة ${file.name} بعد ${nextRetryDelay}ms (${retryCount + 1}/${MAX_RETRIES})`);
          
          updateImage(imageId, { 
            status: "pending",
            extractedText: `فشل في المحاولة ${retryCount + 1}: ${getFriendlyErrorMessage(errorMessage).substring(0, 100)}. جاري إعادة المحاولة بعد ${nextRetryDelay / 1000} ثوانٍ...`
          });
          
          await delay(nextRetryDelay);
          
          return await processFile(file, startingNumber, index, batchId, retryCount + 1);
        }
        
        const friendlyErrorMessage = getFriendlyErrorMessage(errorMessage);
        
        updateImage(imageId, { 
          status: "error",
          extractedText: `فشل في المعالجة بعد ${MAX_RETRIES + 1} محاولات. ${friendlyErrorMessage}`
        });
        
        toast({
          title: "فشل في استخراج النص",
          description: `فشل في معالجة الصورة "${file.name}" بعد ${MAX_RETRIES + 1} محاولات. ${friendlyErrorMessage.substring(0, 100)}`,
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error: any) {
      console.error(`خطأ عام في عملية معالجة الصورة ${file.name}:`, error);
      
      if (imageId) {
        const errorMessage = error.message || "خطأ غير معروف";
        updateImage(imageId, {
          status: "error",
          extractedText: `خطأ عام: ${getFriendlyErrorMessage(errorMessage)}`
        });
      }
      
      return false;
    }
  };

  const getFriendlyErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return "تم تجاوز الحد المسموح من طلبات API. قد تكون وصلت لحد الاستخدام اليومي. حاول مرة أخرى لاحقاً.";
    } else if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
      return "انتهت مهلة الاتصال. تأكد من استقرار اتصالك بالإنترنت وأن حجم الصورة ليس كبيرًا جدًا.";
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return "مشكلة في الاتصال بالخادم. تأكد من اتصالك بالإنترنت واستقراره.";
    } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return "خطأ في خادم API. يرجى المحاولة مرة أخرى لاحقًا عندما يكون الخادم متاحًا.";
    } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('403')) {
      return "مشكلة في المصادقة مع خادم API. تأكد من تكوين مفتاح API بشكل صحيح.";
    } else if (errorMessage.length > 100) {
      return errorMessage.substring(0, 100) + "...";
    }
    return errorMessage;
  };

  const updateProgress = useCallback(() => {
    if (!processingStartTime || !queueProcessing) return;
    
    const totalFiles = processingQueue.length + activeUploads;
    if (totalFiles === 0) {
      setProcessingProgress(100);
      return;
    }
    
    if (currentProcessingIndex === -1) {
      setProcessingProgress(1);
      return;
    }
    
    const progress = Math.floor((currentProcessingIndex / totalFiles) * 100);
    
    setProcessingProgress(Math.max(1, Math.min(99, progress)));
    
    if (activeUploads === 0 && processingQueue.length === 0) {
      setProcessingProgress(100);
      setQueueProcessing(false);
      setIsProcessing(false);
      setProcessingStartTime(null);
      setCurrentProcessingIndex(-1);
    }
  }, [processingStartTime, queueProcessing, processingQueue.length, activeUploads, currentProcessingIndex, setProcessingProgress]);

  const processQueue = useCallback(async () => {
    if (processingQueue.length === 0 || queueProcessing) {
      return;
    }

    setQueueProcessing(true);
    setProcessingStartTime(Date.now());
    setProcessingProgress(1);
    
    const progressInterval = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL);
    
    try {
      const currentQueue = [...processingQueue];
      const batchId = uuidv4();
      const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
      
      setProcessingQueue([]);
      setActiveUploads(currentQueue.length);
      
      console.log(`بدء معالجة دفعة جديدة: ${currentQueue.length} صور مع معرف دفعة: ${batchId}`);
      
      for (let i = 0; i < currentQueue.length; i++) {
        const file = currentQueue[i];
        
        setCurrentProcessingIndex(i);
        
        const progress = Math.floor((i / currentQueue.length) * 100);
        setProcessingProgress(Math.max(1, Math.min(99, progress)));
        
        console.log(`معالجة الصورة ${i + 1} من ${currentQueue.length}: ${file.name}`);
        
        await processFile(file, startingNumber, i, batchId);
        
        if (i < currentQueue.length - 1) {
          console.log(`الانتظار ${MIN_DELAY_BETWEEN_IMAGES}ms قبل معالجة الصورة التالية...`);
          await delay(MIN_DELAY_BETWEEN_IMAGES);
        }
      }
      
      console.log(`اكتملت معالجة الدفعة. ${currentQueue.length} صور تمت معالجتها`);
      
      setProcessingProgress(100);
      setActiveUploads(0);
      setQueueProcessing(false);
      setIsProcessing(false);
      setProcessingStartTime(null);
      setCurrentProcessingIndex(-1);
      clearInterval(progressInterval);
      
      console.log("إعادة حفظ البيانات في localStorage");
      const completedImages = images.filter(img => 
        img.status === "completed" && img.code && img.senderName && img.phoneNumber
      );
      
      if (completedImages.length > 0) {
        saveToLocalStorage(completedImages);
      }
      
      if (removeDuplicates && typeof removeDuplicates === 'function') {
        console.log("إزالة التكرارات بعد الانتهاء من المعالجة...");
        removeDuplicates();
      }
      
      if (processingQueue.length > 0) {
        console.log("هناك صور جديدة في قائمة الانتظار، سيتم معالجتها قريبًا...");
        setTimeout(() => processQueue(), 2000);
      }
    } catch (error) {
      console.error("خطأ أثناء معالجة قائمة الانتظار:", error);
      clearInterval(progressInterval);
      setQueueProcessing(false);
      setIsProcessing(false);
      setProcessingStartTime(null);
      setCurrentProcessingIndex(-1);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الصور. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  }, [processingQueue, queueProcessing, images, addImage, updateImage, setProcessingProgress, updateProgress, removeDuplicates]);

  const manuallyTriggerProcessingQueue = useCallback(() => {
    console.log("تم استدعاء إعادة تشغيل المعالجة يدويًا");
    
    if (processingQueue.length === 0) {
      console.log("لا توجد صور في قائمة الانتظار للمعالجة");
      
      const failedImages = images.filter(img => img.status === "error");
      if (failedImages.length > 0) {
        console.log(`العثور على ${failedImages.length} صورة في حالة خطأ، محاولة إعادة معالجتها...`);
        
        const filesToReprocess = failedImages.map(img => img.file);
        setProcessingQueue(prev => [...prev, ...filesToReprocess]);
        
        failedImages.forEach(img => {
          updateImage(img.id, { 
            status: "pending", 
            extractedText: "في قائمة الانتظار للمعالجة مرة أخرى..." 
          });
        });
        
        toast({
          title: "إعادة المعالجة",
          description: `تمت إضافة ${failedImages.length} صورة فاشلة إلى قائمة انتظار المعالجة.`,
        });
        
        return;
      }
      
      return;
    }
    
    setQueueProcessing(false);
    setCurrentProcessingIndex(-1);
    
    setTimeout(() => {
      processQueue();
    }, 500);
  }, [processingQueue, processQueue, images, updateImage]);

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
    setProcessingProgress(1);
    
    const fileArray = Array.from(files);
    console.log("معالجة", fileArray.length, "ملفات");
    
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
    
    if (removeDuplicates && typeof removeDuplicates === 'function') {
      console.log("تشغيل آلية إزالة التكرارات قبل إضافة الصور الجديدة...");
      removeDuplicates();
    }
    
    await delay(300);
    
    setProcessingQueue(prev => [...prev, ...uniqueFiles]);
  };

  return {
    isProcessing,
    useGemini: true,
    handleFileChange,
    activeUploads,
    queueLength: processingQueue.length,
    manuallyTriggerProcessingQueue,
    cleanupDuplicates: () => {
      if (removeDuplicates && typeof removeDuplicates === 'function') {
        removeDuplicates();
      }
    }
  };
};
