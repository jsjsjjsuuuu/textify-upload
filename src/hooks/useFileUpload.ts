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

interface DuplicateDetector {
  isDuplicateImage?: (image: ImageData, images: ImageData[]) => boolean;
  markImageAsProcessed?: (image: ImageData) => boolean;
  isFullyProcessed?: (image: ImageData) => boolean;
  addToProcessedCache?: (image: ImageData) => void;
}

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
  removeDuplicates?: () => void;
  processedImage?: DuplicateDetector;
}

// تحسين معالجة الصور لتتم بشكل متسلسل وبتتبع أفضل
const MAX_RETRIES = 3;           // عدد محاولات المعالجة لكل صورة
const RETRY_DELAY_MS = 3000;     // تأخير بين المحاولات
const PROGRESS_UPDATE_INTERVAL = 1000; // تحديث تقدم العملية كل ثانية
const MIN_DELAY_BETWEEN_IMAGES = 2000; // تأخير بين معالجة كل صورة (2 ثواني)

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage,
  removeDuplicates,
  processedImage
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0); 
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [lastProcessedImageTime, setLastProcessedImageTime] = useState<number>(0); // تتبع وقت آخر معالجة
  const [processedImageIds, setProcessedImageIds] = useState<Set<string>>(new Set()); // تتبع معرفات الصور المعالجة
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { processWithGemini } = useGeminiProcessing();
  const { formatPhoneNumber, formatPrice } = useDataFormatting();

  // استعادة الصور المعالجة من التخزين المحلي عند بدء التشغيل
  useEffect(() => {
    try {
      const storedProcessedIds = localStorage.getItem('processedSessionImageIds');
      if (storedProcessedIds) {
        const idsArray = JSON.parse(storedProcessedIds);
        setProcessedImageIds(new Set(idsArray));
        console.log(`تم تحميل ${idsArray.length} معرف صورة معالجة من الجلسة السابقة`);
      }
    } catch (error) {
      console.error('خطأ في تحميل معرفات الصور المعالجة:', error);
      // إعادة تعيين في حالة الخطأ
      localStorage.removeItem('processedSessionImageIds');
    }
  }, []);

  // حفظ معرفات الصور المعالجة في التخزين المحلي
  useEffect(() => {
    try {
      if (processedImageIds.size > 0) {
        localStorage.setItem('processedSessionImageIds', JSON.stringify([...processedImageIds]));
      }
    } catch (error) {
      console.error('خطأ في حفظ معرفات الصور المعالجة:', error);
    }
  }, [processedImageIds]);

  // إضافة معرف الصورة إلى قائمة الصور المعالجة
  const markImageAsProcessedLocally = useCallback((imageId: string) => {
    setProcessedImageIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.add(imageId);
      return newIds;
    });
    
    // حفظ مباشر إلى التخزين المحلي لتجنب فقدان البيانات
    try {
      const currentIds = localStorage.getItem('processedSessionImageIds');
      let idsArray: string[] = currentIds ? JSON.parse(currentIds) : [];
      if (!idsArray.includes(imageId)) {
        idsArray.push(imageId);
        localStorage.setItem('processedSessionImageIds', JSON.stringify(idsArray));
      }
    } catch (error) {
      console.error('خطأ في الحفظ المباشر لمعرف الصورة في التخزين المحلي:', error);
    }
  }, []);

  // التحقق إذا كانت الصورة قد تمت معالجتها بالفعل - تحسين دقة الكشف
  const isAlreadyProcessed = useCallback((imageId: string, fileName?: string, fileSize?: number, userId?: string) => {
    // 1. التحقق من معرف الصورة
    const idMatch = processedImageIds.has(imageId);
    
    // 2. البحث في حالات الصور الحالية
    const statusMatch = images.some(img => 
      img.id === imageId && 
      (img.status === "completed" || img.status === "error")
    );
    
    // 3. البحث عن مطابقة اسم الملف والحجم والمستخدم (إذا كانت متوفرة)
    const fileMatch = fileName && fileSize && userId && images.some(img => 
      img.file && 
      img.file.name === fileName && 
      img.file.size === fileSize && 
      img.user_id === userId &&
      (img.status === "completed" || img.status === "error")
    );
    
    const result = idMatch || statusMatch || fileMatch;
    
    if (result) {
      console.log(`الصورة تمت معالجتها بالفعل: ${imageId}${fileName ? ' (' + fileName + ')' : ''}`);
    }
    
    return result;
  }, [processedImageIds, images]);

  // وظيفة رفع الصورة إلى Supabase Storage
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

  // تحسين معالجة ملف واحد مع منطق أفضل للإعادة المحاولة
  const processFile = async (
    file: File, 
    startingNumber: number, 
    index: number, 
    batchId: string, 
    retryCount = 0
  ): Promise<boolean> => {
    // تعريف imageId مبكراً
    const imageId = crypto.randomUUID();
    let tempPreviewUrl: string | null = null;
    
    // التحقق أولاً إذا كانت الصورة تمت معالجتها بالفعل (بناءً على المعرف)
    if (isAlreadyProcessed(imageId, file.name, file.size, user?.id)) {
      console.log(`الصورة ${imageId} (${file.name}) تمت معالجتها بالفعل، تخطي المعالجة`);
      return true;
    }
    
    try {
      console.log(`معالجة الملف [${index}]: ${file.name}, النوع: ${file.type}, المحاولة: ${retryCount + 1}`);
      setCurrentProcessingIndex(index);
      
      // التحقق من أنّ الملف صورة
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: `الملف "${file.name}" ليس صورة، تم تخطيه`,
          variant: "destructive"
        });
        console.log("الملف ليس صورة، تخطي");
        return false;
      }
      
      // تأكد من مرور الوقت الكافي منذ آخر معالجة صورة (تجنب التحميل المتزامن)
      const now = Date.now();
      const timeSinceLastProcessing = now - lastProcessedImageTime;
      if (timeSinceLastProcessing < MIN_DELAY_BETWEEN_IMAGES) {
        const waitTime = MIN_DELAY_BETWEEN_IMAGES - timeSinceLastProcessing;
        console.log(`الانتظار ${waitTime}ms بين معالجة الصور...`);
        await delay(waitTime);
      }
      setLastProcessedImageTime(Date.now());
      
      // تحسين الصورة للتعرف على النصوص
      const enhancedFile = await enhanceImageForOCR(file);
      console.log(`تم تحسين الصورة: ${file.name}, الحجم قبل: ${(file.size / 1024).toFixed(2)}KB, بعد: ${(enhancedFile.size / 1024).toFixed(2)}KB`);
      
      // إنشاء عنوان URL مؤقت للعرض المبدئي
      tempPreviewUrl = createReliableBlobUrl(enhancedFile);
      
      if (!tempPreviewUrl) {
        toast({
          title: "خطأ في تحميل الصورة",
          description: `فشل في إنشاء معاينة للصورة "${file.name}"`,
          variant: "destructive"
        });
        
        // تسجيل الصورة كمعالجة حتى بعد الفشل
        markImageAsProcessedLocally(imageId);
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
        user_id: user?.id,
        batch_id: batchId,
        retryCount: retryCount,
        added_at: Date.now(),
        sessionImage: true // ميزة جديدة لتمييز الصور المؤقتة المضافة في هذه الجلسة
      };
      
      // **فحص إضافي في اكتشاف التكرار قبل المعالجة**
      if (processedImage && processedImage.isDuplicateImage) { 
        const isDuplicate = processedImage.isDuplicateImage(newImage, images);
        if (isDuplicate) {
          console.log(`الصورة ${file.name} تم اكتشافها كمكررة، تخطي المعالجة`);
          // تسجيل الصورة كمعالجة حتى في حالة التكرار
          markImageAsProcessedLocally(imageId);
          
          // إذا كان لدينا إمكانية تسجيل الصورة كمعالجة في نظام اكتشاف التكرار
          if (processedImage.markImageAsProcessed) {
            processedImage.markImageAsProcessed(newImage);
          }
          
          return true;
        }
      }
      
      // إضافة الصورة إلى القائمة أولاً مع حالة "processing" لعرض العملية للمستخدم
      addImage(newImage);
      console.log("تمت إضافة صورة جديدة إلى الحالة بالمعرف:", newImage.id);
      
      // تأخير صغير بعد إضافة الصورة للتأكد من تحديث واجهة المستخدم
      await delay(300);
      
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
        
        // تسجيل الصورة كمعالجة (بحالة خطأ) لتجنب إعادة المحاولة
        markImageAsProcessedLocally(imageId);
        
        // تسجيل الصورة كمعالجة في نظام اكتشاف التكرار
        if (processedImage && processedImage.markImageAsProcessed) {
          processedImage.markImageAsProcessed({
            ...newImage,
            status: "error",
            error: "فشل في تخزين الصورة على الخادم"
          });
        }
        
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
      
      // تأخير صغير قبل معالجة الصورة 
      await delay(700);
      
      try {
        // استخدام Gemini للمعالجة
        console.log(`استخدام Gemini API للاستخراج للصورة ${file.name}`);
        
        const processedData = await processWithGemini(enhancedFile, {
          ...newImage,
          previewUrl,
          storage_path: storagePath
        });
        
        // تنظيف وتحسين رقم الهاتف تلقائيًا بعد المعالجة
        if (processedData.phoneNumber) {
          const originalPhone = processedData.phoneNumber;
          
          // استخدام الدالة المحسنة لتنسيق رقم الهاتف
          processedData.phoneNumber = formatIraqiPhoneNumber(originalPhone);
          
          // تحسين رقم الهاتف باستخدام سياق النص المستخرج
          processedData.phoneNumber = enhancePhoneNumber(
            processedData.phoneNumber, 
            processedData.extractedText || ""
          );
          
          if (originalPhone !== processedData.phoneNumber) {
            console.log(`تم تنظيف رقم الهاتف تلقائيًا بعد المعالجة: "${originalPhone}" -> "${processedData.phoneNumber}"`);
          }
        }
        
        // تحديث حالة الصورة إلى "مكتملة" إذا كانت تحتوي على جميع البيانات الأساسية
        if (processedData.code && processedData.senderName && processedData.phoneNumber) {
          processedData.status = "completed";
        } else if (processedData.status !== "error") {
          processedData.status = "pending";
        }
        
        // إضافة معلومات إضافية
        processedData.user_id = user?.id;
        processedData.storage_path = storagePath;
        processedData.retryCount = retryCount;
        processedData.added_at = Date.now();
        processedData.sessionImage = false; // تغيير إلى false بعد المعالجة الناجحة
        
        // تحديث الصورة بالبيانات المستخرجة
        updateImage(imageId, processedData);
        console.log("تم تحديث الصورة بالبيانات المستخرجة:", imageId);
        
        // تسجيل الصورة كمعالجة سواء نجحت أو فشلت
        markImageAsProcessedLocally(imageId);
        
        // تسجيل الصورة كمعالجة في نظام اكتشاف التكرار
        if (processedImage && processedImage.markImageAsProcessed) {
          processedImage.markImageAsProcessed({
            ...newImage,
            ...processedData
          });
        } else if (processedImage && processedImage.addToProcessedCache) {
          processedImage.addToProcessedCache({
            ...newImage,
            ...processedData
          });
        }
        
        // **حفظ الصورة المعالجة** - معالجة محسنة للوعد
        if (saveProcessedImage && (processedData.status === "completed" || processedData.status === "error")) {
          try {
            await saveProcessedImage({
              ...newImage,
              ...processedData
            });
            console.log("تم حفظ الصورة المعالجة بنجاح:", imageId);
          } catch (saveError) {
            console.error("خطأ في حفظ الصورة المعالجة:", saveError);
            // لا نريد أن نفشل العملية كاملة بسبب فشل الحفظ
          }
        }
        
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
        const friendlyErrorMessage = getFriendlyErrorMessage(processingError.message || 'خطأ غير معروف');
        
        const errorUpdate = { 
          status: "error" as const,
          extractedText: `فشل في المعالجة بعد ${MAX_RETRIES + 1} محاولات. ${friendlyErrorMessage}`
        };
        
        updateImage(imageId, errorUpdate);
        
        // تسجيل الصورة كمعالجة (بحالة خطأ) لمنع إعادة المحاولة
        markImageAsProcessedLocally(imageId);
        
        // تسجيل الصورة كمعالجة في نظام اكتشاف التكرار
        if (processedImage && processedImage.markImageAsProcessed) {
          processedImage.markImageAsProcessed({
            ...newImage,
            ...errorUpdate
          });
        } else if (processedImage && processedImage.addToProcessedCache) {
          processedImage.addToProcessedCache({
            ...newImage,
            ...errorUpdate
          });
        }
        
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
        const errorUpdate = {
          status: "error" as const,
          extractedText: `خطأ عام: ${error.message || "خطأ غير معروف"}`
        };
        
        updateImage(imageId, errorUpdate);
        
        // تسجيل الصورة كمعالجة (بحالة خطأ)
        markImageAsProcessedLocally(imageId);
        
        // تسجيل الصورة كمعالجة في نظام اكتشاف التكرار
        if (processedImage && processedImage.markImageAsProcessed && file) {
          processedImage.markImageAsProcessed({
            id: imageId,
            file,
            previewUrl: tempPreviewUrl || '',
            date: new Date(),
            status: "error",
            error: error.message || "خطأ غير معروف",
            extractedText: `خطأ عام: ${error.message || "خطأ غير معروف"}`
          });
        }
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
    
    if (currentProcessingIndex === -1) {
      // إذا لم تبدأ المعالجة بعد، نعرض 1% لإظهار بداية التقدم
      setProcessingProgress(1);
      return;
    }
    
    // حساب التقدم بناءً على الفهرس الحالي للمعالجة
    const progress = Math.floor((currentProcessingIndex / totalFiles) * 100);
    
    // التأكد من أن التقدم بين 1% و 99%
    setProcessingProgress(Math.max(1, Math.min(99, progress)));
    
    // إذا تم الانتهاء من جميع الملفات
    if (activeUploads === 0 && processingQueue.length === 0) {
      setProcessingProgress(100);
      setQueueProcessing(false);
      setIsProcessing(false);
      setProcessingStartTime(null);
      setCurrentProcessingIndex(-1);
    }
  }, [processingStartTime, queueProcessing, processingQueue.length, activeUploads, currentProcessingIndex, setProcessingProgress]);

  // تحسين معالجة قائمة الانتظار للتأكد من المعالجة التسلسلية
  const processQueue = useCallback(async () => {
    if (processingQueue.length === 0 || queueProcessing) {
      return;
    }

    setQueueProcessing(true);
    setProcessingStartTime(Date.now());
    setProcessingProgress(1); // بدء بقيمة 1% لإظهار أن هناك تقدمًا
    
    // إعداد مؤقت لتحديث التقدم
    const progressInterval = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL);
    
    try {
      // نسخة من قائمة الانتظار الحالية
      const currentQueue = [...processingQueue];
      const batchId = uuidv4(); // معرف فريد للدفعة
      const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
      
      // مسح القائمة الأصلية
      setProcessingQueue([]);
      setActiveUploads(currentQueue.length);
      
      console.log(`بدء معالجة دفعة جديدة: ${currentQueue.length} صور مع معرف دفعة: ${batchId}`);
      
      // معالجة الصور واحدة تلو الأخرى بشكل متسلسل بوضوح
      for (let i = 0; i < currentQueue.length; i++) {
        const file = currentQueue[i];
        
        // تعيين مؤشر المعالجة الحالي
        setCurrentProcessingIndex(i);
        
        // تحديث النسبة المئوية للتقدم
        const progress = Math.floor((i / currentQueue.length) * 100);
        setProcessingProgress(Math.max(1, Math.min(99, progress)));
        
        console.log(`معالجة الصورة ${i + 1} من ${currentQueue.length}: ${file.name}`);
        
        // معالجة الملف الحالي
        await processFile(file, startingNumber, i, batchId);
        
        // تأخير محدد بين معالجة كل صورة لتجنب التنافس على الموارد
        if (i < currentQueue.length - 1) {
          console.log(`الانتظار ${MIN_DELAY_BETWEEN_IMAGES}ms قبل معالجة الصورة التالية...`);
          await delay(MIN_DELAY_BETWEEN_IMAGES);
        }
      }
      
      console.log(`اكتملت معالجة الدفعة. ${currentQueue.length} صور تمت معالجتها`);
      
      // تحديث التقدم إلى 100% عند الانتهاء
      setProcessingProgress(100);
      setActiveUploads(0);
      setQueueProcessing(false);
      setIsProcessing(false);
      setProcessingStartTime(null);
      setCurrentProcessingIndex(-1);
      clearInterval(progressInterval);
      
      // تحديث إحصائيات التخزين
      console.log("إعادة حفظ البيانات في localStorage");
      const completedImages = images.filter(img => 
        img.status === "completed" && img.code && img.senderName && img.phoneNumber
      );
      
      if (completedImages.length > 0) {
        saveToLocalStorage(completedImages);
      }
      
      // إزالة التكرارات بعد الانتهاء من المعالجة
      if (removeDuplicates && typeof removeDuplicates === 'function') {
        console.log("إزالة التكرارات بعد الانتهاء من المعالجة...");
        removeDuplicates();
      }
      
      // التحقق من وجود قائمة انتظار جديدة
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
  }, [processingQueue, queueProcessing, images, addImage, updateImage, setProcessingProgress, updateProgress, removeDuplicates, markImageAsProcessedLocally]);

  // وظيفة لإعادة تشغيل المعالجة يدويًا - معطلة الآن
  const manuallyTriggerProcessingQueue = useCallback(() => {
    console.log("تم تعطيل وظيفة إعادة تشغيل المعالجة");
    // لا تفعل شيئًا - الوظيفة معطلة
    return;
  }, []);

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
    setProcessingProgress(1); // بدء بقيمة صغيرة
    
    const fileArray = Array.from(files);
    console.log("معالجة", fileArray.length, "ملفات");
    
    // تحسين فحص الصور المكررة ليشمل التحقق من نظام اكتشاف التكرار
    const uniqueFiles = fileArray.filter(file => {
      // البحث عن تطابق في الصور الحالية
      const isDuplicateInCurrent = images.some(img => 
        img.file.name === file.name && 
        img.file.size === file.size &&
        (img.status === "completed" || img.status === "error")
      );
      
      // فحص إضافي باستخدام معالج التكرار المحسن
      let isDuplicateInDetector = false;
      if (processedImage && processedImage.isDuplicateImage) {
        // إنشاء كائن بيانات صورة مؤقت للفحص
        const tempId = crypto.randomUUID();
        const tempImage: ImageData = {
          id: tempId,
          file,
          previewUrl: URL.createObjectURL(file),
          date: new Date(),
          status: "pending",
          user_id: user.id
        };
        
        isDuplicateInDetector = processedImage.isDuplicateImage(tempImage, images);
        
        // تنظيف عنوان URL المؤقت
        URL.revokeObjectURL(tempImage.previewUrl);
      }
      
      const isDuplicate = isDuplicateInCurrent || isDuplicateInDetector;
      
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
  };

  return {
    isProcessing,
    useGemini: true,
    handleFileChange,
    activeUploads,
    queueLength: processingQueue.length,
    manuallyTriggerProcessingQueue, // مرجع للوظيفة المعطلة
    // إضافة وظيفة جديدة لعمليات التنظيف
    cleanupDuplicates: () => {
      if (removeDuplicates && typeof removeDuplicates === 'function') {
        removeDuplicates();
      }
    }
  };
};
