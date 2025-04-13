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

// إضافة الخصائص الناقصة إلى الواجهة وتعديل تعريف isDuplicateImage ليكون غير متزامن
export interface DuplicateDetector {
  isDuplicateImage?: (image: ImageData, images: ImageData[]) => Promise<boolean> | boolean;
  markImageAsProcessed?: (image: ImageData) => void;
  isFullyProcessed?: (image: ImageData) => boolean;
  addToProcessedCache?: (image: ImageData) => void;
}

export interface UseFileUploadProps {
  images?: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
  removeDuplicates?: () => void;
  processedImage?: DuplicateDetector;
  // إضافة الخصائص المفقودة
  processWithOcr?: (file: File, image: ImageData) => Promise<ImageData>;
  duplicateDetection?: DuplicateDetector;
  processWithGemini?: (file: File | Blob, image: ImageData) => Promise<ImageData>;
}

// تحسين معالجة الصور لتتم بشكل متسلسل وبتتبع أفضل
const MAX_RETRIES = 3;           // عدد محاولات المعالجة لكل صورة
const RETRY_DELAY_MS = 3000;     // تأخير بين المحاولات
const PROGRESS_UPDATE_INTERVAL = 1000; // تحديث تقدم العملية كل ثانية
const MIN_DELAY_BETWEEN_IMAGES = 2000; // تأخير بين معالجة كل صورة (2 ثواني)

// مفتاح موحد للتخزين المحلي لمعرفات الصور المعالجة
const PROCESSED_FILES_KEY = 'processedUnifiedImageFiles';

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage,
  removeDuplicates,
  processedImage,
  processWithOcr,
  processWithGemini
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0); 
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [lastProcessedImageTime, setLastProcessedImageTime] = useState<number>(0);
  const [processedFileSignatures, setProcessedFileSignatures] = useState<Set<string>>(new Set());
  // إضافة متغير حالة لتتبع تقدم المعالجة بشكل صريح
  const [processingProgress, setLocalProcessingProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { processWithGemini: geminiProcessor } = useGeminiProcessing();
  const { formatPhoneNumber, formatPrice } = useDataFormatting();

  // استعادة الصور المعالجة من التخزين المحلي عند بدء التشغيل
  useEffect(() => {
    try {
      const storedProcessedFiles = localStorage.getItem(PROCESSED_FILES_KEY);
      if (storedProcessedFiles) {
        const filesArray = JSON.parse(storedProcessedFiles);
        setProcessedFileSignatures(new Set(filesArray));
        console.log(`تم تحميل ${filesArray.length} توقيع ملف معالج من التخزين المحلي`);
      }
      
      // دمج البيانات القديمة للتوافق مع الإصدارات السابقة
      mergeOldStorageData();
    } catch (error) {
      console.error('خطأ في تحميل توقيعات الملفات المعالجة:', error);
      // إعادة تعيين في حالة الخطأ
      localStorage.removeItem(PROCESSED_FILES_KEY);
    }
  }, []);

  // دمج البيانات القديمة مع النظام الجديد
  const mergeOldStorageData = useCallback(() => {
    try {
      // التحقق من وجود بيانات قديمة
      const oldSessionIds = localStorage.getItem('processedSessionImageIds');
      
      if (oldSessionIds) {
        // تحويل المعرفات القديمة
        const oldIdsArray = JSON.parse(oldSessionIds);
        
        // البيانات القديمة تحتوي على معرفات وليس توقيعات ملفات، لكننا سنحتفظ بها للتوافق
        setProcessedFileSignatures(prev => {
          const newSet = new Set(prev);
          oldIdsArray.forEach((id: string) => newSet.add(`id-${id}`));
          return newSet;
        });
        
        // حفظ البيانات المدمجة
        setTimeout(() => {
          localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify([...processedFileSignatures]));
          
          // حذف البيانات القديمة بعد دمجها
          localStorage.removeItem('processedSessionImageIds');
        }, 0);
        
        console.log('تم دمج البيانات القديمة مع نظام التخزين الجديد');
      }
    } catch (error) {
      console.error('خطأ في دمج البيانات القديمة:', error);
    }
  }, [processedFileSignatures]);

  // حفظ توقيعات الملفات المعالجة في التخزين المحلي
  useEffect(() => {
    try {
      if (processedFileSignatures.size > 0) {
        localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify([...processedFileSignatures]));
      }
    } catch (error) {
      console.error('خطأ في حفظ توقيعات الملفات المعالجة:', error);
    }
  }, [processedFileSignatures]);

  // إنشاء توقيع للملف (مزيج من الاسم والحجم ووقت التعديل الأخير)
  const createFileSignature = useCallback((file: File): string => {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }, []);

  // التحقق مما إذا كان الملف قد تمت معالجته من قبل
  const isFileProcessed = useCallback((file: File): boolean => {
    const signature = createFileSignature(file);
    return processedFileSignatures.has(signature);
  }, [createFileSignature, processedFileSignatures]);

  // تسجيل ملف كمعالج
  const markFileAsProcessed = useCallback((file: File): void => {
    const signature = createFileSignature(file);
    setProcessedFileSignatures(prev => {
      const newSet = new Set(prev);
      newSet.add(signature);
      return newSet;
    });
    
    // حفظ مباشر إلى التخزين المحلي لتجنب فقدان البيانات
    try {
      const currentFiles = localStorage.getItem(PROCESSED_FILES_KEY);
      let filesArray: string[] = currentFiles ? JSON.parse(currentFiles) : [];
      if (!filesArray.includes(signature)) {
        filesArray.push(signature);
        localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify(filesArray));
      }
    } catch (error) {
      console.error('خطأ في الحفظ المباشر لتوقيع الملف في التخزين المحلي:', error);
    }
  }, [createFileSignature]);

  // وظيفة معالجة طابور الملفات بشكل متسلسل
  const processQueue = useCallback(async () => {
    if (processingQueue.length === 0 || queueProcessing) {
      // إذا كانت القائمة فارغة، نتأكد من تصفير حالة المعالجة
      if (processingQueue.length === 0) {
        console.log("قائمة المعالجة فارغة. تصفير حالة المعالجة.");
        setActiveUploads(0);
        setLocalProcessingProgress(100);
        setProcessingProgress(100);
        // سنقوم بتأخير إيقاف المعالجة لضمان أن المستخدم يرى أن العملية اكتملت
        setTimeout(() => {
          setIsProcessing(false);
          setQueueProcessing(false);
        }, 1500);
      }
      return;
    }
    
    setQueueProcessing(true);
    setProcessingStartTime(Date.now());
    setCurrentProcessingIndex(0);
    
    // تتبع عدد الصور المكررة المكتشفة
    let duplicatesFound = 0;
    
    // معالجة كل ملف في الطابور بشكل متسلسل
    for (let i = 0; i < processingQueue.length; i++) {
      setCurrentProcessingIndex(i);
      
      const file = processingQueue[i];
      const currentProgress = Math.round(((i + 1) / processingQueue.length) * 100);
      setLocalProcessingProgress(currentProgress);
      setProcessingProgress(currentProgress);
      
      // تحديث عدد الملفات النشطة بدقة
      setActiveUploads(processingQueue.length - i);
      
      // التحقق مما إذا كان هذا الملف قد تمت معالجته بالفعل
      if (isFileProcessed(file)) {
        console.log(`تخطي الملف المعالج مسبقًا: ${file.name}`);
        duplicatesFound++;
        continue;
      }
      
      try {
        // إنشاء كائن ImageData جديد
        const previewUrl = URL.createObjectURL(file);
        const newImage: ImageData = {
          id: uuidv4(),
          file,
          previewUrl,
          date: new Date(),
          status: "pending" as const,
          number: i + 1,
          user_id: user?.id,
          batch_id: `batch-${Date.now()}`,
          sessionImage: true
        };
        
        // التحقق من التكرارات باستخدام وظائف اكتشاف التكرار إذا كانت متاحة
        const isDuplicate = processedImage?.isDuplicateImage?.(newImage, images || []) || false;
        if (isDuplicate) {
          console.log(`تم اكتشاف تكرار للصورة: ${file.name}`);
          URL.revokeObjectURL(previewUrl);
          
          // تسجيل الملف كمعالج لمنع إعادة المعالجة في المستقبل
          markFileAsProcessed(file);
          
          duplicatesFound++;
          continue;
        }
        
        // إضافة الصورة إلى القائمة
        addImage(newImage);
        
        // معالجة الصورة مباشرة بعد إضافتها
        try {
          console.log(`بدء معالجة الصورة ${file.name}`);
          
          // ضمان تعيين حالة المعالجة
          updateImage(newImage.id, { status: "processing" });
          
          // استخدام Gemini لمعالجة الصورة إذا كان متاحًا
          if (processWithGemini || geminiProcessor) {
            const processorToUse = processWithGemini || geminiProcessor;
            const processedImage = await processorToUse(file, newImage);
            console.log("تمت معالجة الصورة باستخدام Gemini:", processedImage.status);
            
            // تحديث الصورة بالنتائج
            updateImage(newImage.id, { 
              ...processedImage,
              status: "completed",
            });
            
            // تعيين الصورة الحالية كصورة نشطة لعرض البيانات المستخرجة فوراً
            if (window && window.dispatchEvent) {
              console.log("إطلاق حدث معالجة الصورة:", newImage.id);
              window.dispatchEvent(new CustomEvent('image-processed', { 
                detail: { imageId: newImage.id } 
              }));
            }
            
            // حفظ الصورة المعالجة إذا كانت الوظيفة متاحة
            if (saveProcessedImage) {
              await saveProcessedImage(processedImage);
            }
          } 
          // استخدام OCR إذا كان Gemini غير متاح
          else if (processWithOcr) {
            const processedImage = await processWithOcr(file, newImage);
            console.log("تمت معالجة الصورة باستخدام OCR:", processedImage.status);
            
            // تحديث الصورة بالنتائج
            updateImage(newImage.id, { 
              ...processedImage,
              status: "completed",
            });
            
            // تعيين الصورة الحالية كصورة نشطة لعرض البيانات المستخرجة فوراً
            if (window && window.dispatchEvent) {
              console.log("إطلاق حدث معالجة الصورة:", newImage.id);
              window.dispatchEvent(new CustomEvent('image-processed', { 
                detail: { imageId: newImage.id } 
              }));
            }
            
            // حفظ الصورة المعالجة إذا كانت الوظيفة متاحة
            if (saveProcessedImage) {
              await saveProcessedImage(processedImage);
            }
          } else {
            console.warn("لم يتم توفير طريقة معالجة للصورة. سيتم تحديثها كصورة غير معالجة.");
            updateImage(newImage.id, { status: "error", extractedText: "لم يتم توفير طريقة معالجة للصورة" });
          }
        } catch (processingError) {
          console.error(`خطأ أثناء معالجة الصورة ${file.name}:`, processingError);
          updateImage(newImage.id, { 
            status: "error", 
            extractedText: `حدث خطأ أثناء معالجة الصورة: ${processingError instanceof Error ? processingError.message : String(processingError)}` 
          });
        }
        
        // تسجيل الملف كمعالج
        markFileAsProcessed(file);
        
        // تسجيل وقت معالجة آخر صورة
        setLastProcessedImageTime(Date.now());
      } catch (error) {
        console.error(`خطأ في إضافة الملف ${file.name}:`, error);
      }
      
      // إضافة تأخير بين الصور لمنع الطلبات المتزامنة
      if (i < processingQueue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, MIN_DELAY_BETWEEN_IMAGES));
      }
    }
    
    // رسائل تشخيصية لمتابعة حالة المعالجة
    console.log("انتهت حلقة معالجة الصور. عدد الملفات المعالجة:", processingQueue.length);
    
    // الانتهاء من المعالجة
    setQueueProcessing(false);
    setProcessingQueue([]);
    setCurrentProcessingIndex(-1);
    setActiveUploads(0); // تصفير عدد الملفات النشطة عند الانتهاء
    setLocalProcessingProgress(100); // تعيين التقدم إلى 100% عند الانتهاء
    setProcessingProgress(100);
    
    // انتظار للحظة قبل إيقاف المعالجة
    setTimeout(() => {
      console.log("إيقاف حالة المعالجة بعد الانتهاء من جميع الملفات");
      setIsProcessing(false);
    }, 1500);
    
    // إزالة التكرارات بعد الانتهاء من المعالجة
    console.log('إزالة التكرارات بعد الانتهاء من المعالجة...');
    if (removeDuplicates) {
      removeDuplicates();
    }
    
    // إظهار رسالة عن عدد التكرارات التي تم اكتشافها
    if (duplicatesFound > 0) {
      toast({
        title: "اكتشاف تكرارات",
        description: `تم تخطي ${duplicatesFound} صورة مكررة أثناء المعالجة`,
      });
    }
    
    // نحدث الإحصائيات في المخزن المحلي
    if (images) {
      saveToLocalStorage(images);
    }
    
    // فحص ما إذا كانت هناك صور أخرى في قائمة الانتظار
    if (processingQueue.length > 0) {
      console.log('هناك صور جديدة في قائمة الانتظار، سيتم معالجتها قريبًا...');
    } else {
      console.log('انتهت معالجة جميع الصور');
      
      // إذا لم تتم إضافة أي صور بسبب أنها كلها مكررات
      if (duplicatesFound === processingQueue.length && duplicatesFound > 0) {
        toast({
          title: "تم تخطي جميع الصور",
          description: "جميع الصور التي تم تحميلها موجودة بالفعل وتم معالجتها مسبقًا",
        });
      }
    }
  }, [
    processingQueue, 
    queueProcessing, 
    addImage, 
    setProcessingProgress, 
    user, 
    images, 
    removeDuplicates,
    isFileProcessed,
    markFileAsProcessed,
    processedImage,
    toast,
    updateImage,
    saveProcessedImage,
    processWithOcr,
    processWithGemini,
    geminiProcessor
  ]);

  // وظيفة تنظيف التكرارات من الذاكرة المؤقتة
  const cleanupDuplicates = useCallback(() => {
    // تنظيف القائمة الحالية من التكرارات
    if (removeDuplicates) {
      removeDuplicates();
    }
    
    // عرض رسالة تأكيد
    toast({
      title: "تم تنظيف التكرارات",
      description: "تم تنظيف الذاكرة المؤقتة من الصور المكررة"
    });
  }, [removeDuplicates, toast]);

  // بدء المعالجة عندما يتغير الطابور
  useEffect(() => {
    if (processingQueue.length > 0 && !queueProcessing) {
      console.log(`بدء معالجة ${processingQueue.length} ملفات في قائمة الانتظار`);
      processQueue();
    } else if (processingQueue.length === 0 && queueProcessing) {
      // التأكد من تحديث الحالة إذا تم إفراغ القائمة بينما المعالجة جارية
      console.log("القائمة فارغة لكن المعالجة لا تزال جارية. إيقاف المعالجة...");
      setQueueProcessing(false);
      setIsProcessing(false);
      setLocalProcessingProgress(100);
      setProcessingProgress(100);
      setActiveUploads(0);
    }
  }, [processingQueue, queueProcessing, processQueue]);

  // تعديل تتبع التقدم لاستخدام المتغير المحلي والخارجي
  useEffect(() => {
    if (!queueProcessing || processingQueue.length === 0) {
      return;
    }
    
    const interval = setInterval(() => {
      if (currentProcessingIndex >= 0) {
        const progress = Math.round(((currentProcessingIndex + 1) / processingQueue.length) * 100);
        setLocalProcessingProgress(progress);
        // استخدام setProcessingProgress الخارجية لمزامنة التقدم مع المكونات الأخرى
        setProcessingProgress(progress);
        
        // تحديث عدد الملفات النشطة
        const remainingFiles = Math.max(0, processingQueue.length - currentProcessingIndex - 1);
        setActiveUploads(remainingFiles > 0 ? 1 : 0);
        
        // تشخيص حالة المعالجة
        console.log(`تحديث حالة المعالجة: progress=${progress}%, remaining=${remainingFiles}, active=${remainingFiles > 0 ? 1 : 0}`);
      }
    }, 1000); // تحديث كل ثانية
    
    return () => clearInterval(interval);
  }, [queueProcessing, processingQueue, currentProcessingIndex, setProcessingProgress]);

  // معالجة الملفات المحددة
  const handleFileChange = useCallback(
    (fileList: FileList | File[]) => {
      console.log(`استلام ${fileList.length} ملف للمعالجة`);
      
      const files = Array.from(fileList);
      
      // منع تحميل الملفات غير المدعومة
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          toast({
            title: "ملف غير مدعوم",
            description: `الملف ${file.name} ليس صورة`,
            variant: "destructive",
          });
        }
        return isImage;
      });
      
      if (validFiles.length === 0) {
        return;
      }
      
      // فلترة الملفات المكررة
      const newFiles = validFiles.filter(file => !isFileProcessed(file));
      
      // إذا كانت جميع الملفات مكررة
      if (newFiles.length === 0 && validFiles.length > 0) {
        toast({
          title: "ملفات مكررة",
          description: "جميع الملفات التي تم تحميلها تمت معالجتها من قبل",
          variant: "destructive",
        });
        return;
      }
      
      setIsProcessing(true);
      setProcessingQueue(prev => [...prev, ...newFiles]);
      setActiveUploads(newFiles.length);
      
      // إعلام المستخدم بعدد الملفات التي سيتم معالجتها
      if (newFiles.length < validFiles.length) {
        const skippedCount = validFiles.length - newFiles.length;
        toast({
          title: "جاري المعالجة",
          description: `تتم معالجة ${newFiles.length} ملف. تم تخطي ${skippedCount} ملف مكرر.`,
        });
      } else {
        toast({
          title: "جاري المعالجة",
          description: `تتم معالجة ${newFiles.length} ملف`,
        });
      }
      
      // تشخيص
      console.log(`تمت إضافة ${newFiles.length} ملف إلى قائمة المعالجة. الحالة: active=${newFiles.length}`);
    },
    [addImage, toast, isFileProcessed]
  );

  return {
    isProcessing,
    handleFileChange,
    activeUploads,
    queueLength: processingQueue.length,
    cleanupDuplicates,
    // تصدير متغير تقدم المعالجة
    processingProgress: processingProgress
  };
};
