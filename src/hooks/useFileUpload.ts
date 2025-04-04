import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { v4 as uuidv4 } from 'uuid';
import { useOcrExtraction } from "@/hooks/useOcrExtraction";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/imageDataParser";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useImageStats } from "@/hooks/useImageStats";
import { getImageHash } from "@/utils/imageHash";

interface FileUploadParams {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, updates: Partial<ImageData>) => void;
  setProcessingProgress: React.Dispatch<React.SetStateAction<{ total: number; current: number; errors: number; }>>;
  saveProcessedImage: (image: ImageData) => Promise<void>;
  isDuplicateImage: (newImage: ImageData, allImages: ImageData[]) => boolean;
  removeDuplicates: () => void;
}

interface QueueItem {
  file: File;
  image: ImageData;
}

export const useFileUpload = (params: FileUploadParams) => {
  const {
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage,
    isDuplicateImage,
    removeDuplicates
  } = params;

  // قائمة انتظار الملفات المراد معالجتها
  const [fileQueue, setFileQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPaused, setProcessingPaused] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  
  // استخدام Gemini أو OCR
  const [useGeminiOption, setUseGeminiOption] = useState(true);
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { extractTextFromImage } = useOcrExtraction();
  const { toast } = useToast();
  
  // إضافة متغيرات معالجة إضافية
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // التأكد من عدم معالجة الصور المكررة عن طريق استخدام الهاش
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set());
  
  // وظيفة مساعدة لتأخير التنفيذ
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // وظيفة لتهيئة الصورة وإضافتها إلى قائمة الانتظار
  const enqueueFile = useCallback(async (file: File) => {
    const id = uuidv4();
    const previewUrl = URL.createObjectURL(file);
    
    // حساب الهاش للصورة
    const imageHash = await getImageHash(file);
    
    const newImage: ImageData = {
      id,
      file,
      previewUrl,
      status: "pending",
      extractedText: null,
      code: null,
      senderName: null,
      phoneNumber: null,
      province: null,
      price: null,
      companyName: null,
      submitted: false,
      created_at: new Date().toISOString(),
      imageHash: imageHash,
      extractionMethod: "ocr"
    };
    
    // التحقق من الصورة المكررة
    if (isDuplicateImage(newImage, images)) {
      URL.revokeObjectURL(previewUrl);
      toast({
        title: "تكرار",
        description: "تم بالفعل رفع هذه الصورة",
        variant: "destructive",
      });
      return;
    }
    
    // إضافة الصورة إلى قائمة الانتظار
    setFileQueue(prevQueue => [...prevQueue, { file, image: newImage }]);
    addImage(newImage);
    
    // بدء المعالجة إذا لم تكن قيد التشغيل بالفعل
    if (!isProcessing && !processingPaused) {
      processQueue();
    }
  }, [addImage, images, isDuplicateImage, isProcessing, processingPaused, toast, setFileQueue]);

  // وظيفة لمعالجة قائمة الانتظار
  const processQueue = useCallback(async () => {
    if (isProcessing || processingPaused) {
      console.log("المعالجة قيد التشغيل بالفعل أو متوقفة مؤقتًا");
      return;
    }
    
    if (fileQueue.length === 0) {
      console.log("قائمة الانتظار فارغة");
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);
    setActiveUploads(prev => prev + 1);
    
    let currentQueue = fileQueue;
    
    while (currentQueue.length > 0 && !processingPaused) {
      const [nextItem, ...remainingQueue] = currentQueue;
      setFileQueue(remainingQueue);
      
      try {
        // معالجة الملف الحالي
        const updatedImage = await processFile(nextItem);
        
        // تحديث الصورة في الحالة
        updateImage(updatedImage.id, updatedImage);
        
        // تحديث قائمة الانتظار
        currentQueue = remainingQueue;
      } catch (error) {
        console.error("خطأ أثناء معالجة قائمة الانتظار:", error);
        setProcessingError(`فشل في معالجة قائمة الانتظار: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        break;
      } finally {
        setActiveUploads(prev => Math.max(0, prev - 1));
      }
    }
    
    setIsProcessing(false);
    
    if (processingPaused) {
      console.log("تم إيقاف المعالجة مؤقتًا");
    } else {
      console.log("اكتملت معالجة قائمة الانتظار");
    }
  }, [fileQueue, isProcessing, processingPaused, processFile, updateImage, setProcessingError]);

  // وظيفة لمعالجة ملف واحد
  const processFile = async (queueItem: QueueItem) => {
    const { file, image } = queueItem;
    
    // حفظ الملف في صورته الأصلية بشكل نهائي
    try {
      const updatedImage = await processFileDirectly(file, image);
      setActiveUploads(prev => Math.max(0, prev - 1));
      return updatedImage;
    } catch (error) {
      console.error(`فشل في معالجة الملف ${file.name}:`, error);
      setActiveUploads(prev => Math.max(0, prev - 1));
      
      // إعادة الصورة مع حالة الخطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: `فشل في معالجة الصورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  };

  // معالجة الملف بشكل فردي
  const processFileDirectly = async (file: File, image: ImageData): Promise<ImageData> => {
    console.log(`بدء معالجة الملف ${file.name} [${image.id}]`);
    
    try {
      // تحديث تقدم المعالجة
      setProcessingProgress(prevProgress => ({
        ...prevProgress,
        total: (prevProgress.total || 0) + 1,
        current: (prevProgress.current || 0) + 1,
      }));
      
      // التحقق من الصورة المعالجة سابقًا باستخدام الهاش
      if (image.imageHash && processedHashes.has(image.imageHash)) {
        console.log(`تم تخطي الصورة المكررة ${file.name} بالهاش ${image.imageHash}`);
        return image; // إرجاع الصورة كما هي
      }
      
      // حساب معرف فريد للملف
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      
      // تحديث حالة الصورة إلى "جاري المعالجة"
      updateImage(image.id, { status: "processing" });
      
      let resultImage: ImageData;
      
      // استخدام Gemini أو OCR بناءً على الإعدادات
      if (useGeminiOption && useGemini) {
        try {
          console.log(`معالجة الصورة ${file.name} باستخدام Gemini`);
          resultImage = await processWithGemini(file, image);
        } catch (geminiError) {
          console.error(`فشل Gemini في معالجة الصورة ${file.name}:`, geminiError);
          console.log("الرجوع إلى OCR...");
          
          // الرجوع إلى OCR إذا فشل Gemini
          try {
            const result = await extractTextFromImage(file, { language: 'ara+eng' });
            
            // استخراج البيانات من النص باستخدام imageDataParser
            const parsedData = parseDataFromOCRText(result.text);
            console.log("البيانات المستخرجة من OCR:", parsedData);
            
            resultImage = updateImageWithExtractedData(
              image,
              result.text,
              parsedData,
              result.confidence,
              "ocr"
            );
          } catch (ocrError) {
            console.error(`فشل OCR في معالجة الصورة ${file.name}:`, ocrError);
            resultImage = {
              ...image,
              status: "pending" as const,
              extractedText: `فشل في استخراج البيانات. يرجى الإدخال اليدوي. خطأ: ${ocrError instanceof Error ? ocrError.message : 'خطأ غير معروف'}`
            };
          }
        }
      } else {
        try {
          console.log(`معالجة الصورة ${file.name} باستخدام OCR`);
          
          // استخدام OCR مباشرة
          const result = await extractTextFromImage(file, { language: 'ara+eng' });
          
          // استخراج البيانات من النص باستخدام imageDataParser
          const parsedData = parseDataFromOCRText(result.text);
          console.log("البيانات المستخرجة من OCR:", parsedData);
          
          resultImage = updateImageWithExtractedData(
            image,
            result.text,
            parsedData,
            result.confidence,
            "ocr"
          );
        } catch (ocrError) {
          console.error(`فشل OCR في معالجة الصورة ${file.name}:`, ocrError);
          resultImage = {
            ...image,
            status: "pending" as const,
            extractedText: `فشل في استخراج البيانات. يرجى الإدخال اليدوي. خطأ: ${ocrError instanceof Error ? ocrError.message : 'خطأ غير معروف'}`
          };
        }
      }
      
      // وضع علامة على الصورة كمعالجة باستخدام الهاش
      if (resultImage.imageHash) {
        setProcessedHashes(prev => {
          const newSet = new Set(prev);
          newSet.add(resultImage.imageHash as string);
          return newSet;
        });
      }
      
      // حفظ الصورة المعالجة
      if (saveProcessedImage && resultImage.status !== 'error') {
        try {
          await saveProcessedImage(resultImage);
          console.log(`تم حفظ الصورة المعالجة بنجاح ${file.name}`);
        } catch (saveError) {
          console.error(`فشل في حفظ الصورة المعالجة ${file.name}:`, saveError);
        }
      }
      
      // وضع علامة على الصورة كمعالجة
      markImageAsProcessed(resultImage.id);
      
      return resultImage;
    } catch (error) {
      console.error(`خطأ غير متوقع أثناء معالجة الملف ${file.name}:`, error);
      
      // تحديث تقدم المعالجة في حالة الخطأ
      setProcessingProgress(prevProgress => ({
        ...prevProgress,
        errors: (prevProgress.errors || 0) + 1,
      }));
      
      // إرجاع الصورة مع حالة الخطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: `فشل في معالجة الصورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  };

  // وظيفة لتغيير الملف
  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    // تحويل FileList إلى Array
    const fileArray = Array.from(files);
    
    // إضافة الملفات إلى قائمة الانتظار
    for (const file of fileArray) {
      await enqueueFile(file);
    }
  }, [enqueueFile]);
  
  // إيقاف عملية المعالجة مؤقتًا
  const pauseProcessing = () => {
    if (isProcessing || fileQueue.length > 0) {
      setProcessingPaused(true);
      console.log("تم إيقاف المعالجة مؤقتًا");
      return true;
    }
    return false;
  };
  
  // استئناف عملية المعالجة
  const resumeProcessing = () => {
    if (processingPaused) {
      setProcessingPaused(false);
      if (fileQueue.length > 0 && !isProcessing) {
        processQueue();
      }
      console.log("تم استئناف المعالجة");
      return true;
    }
    return false;
  };
  
  // مسح قائمة الانتظار
  const clearQueue = () => {
    setFileQueue([]);
    console.log("تم مسح قائمة الانتظار");
  };
  
  // تنظيف ذاكرة التخزين المؤقت للهاش
  const clearProcessedHashesCache = () => {
    setProcessedHashes(new Set());
    console.log("تم مسح ذاكرة التخزين المؤقت للهاش");
  };
  
  // إعادة تشغيل عملية المعالجة يدويًا
  const manuallyTriggerProcessingQueue = () => {
    console.log("إعادة تشغيل عملية معالجة الصور...");
    
    if (fileQueue.length > 0) {
      if (processingPaused) {
        resumeProcessing();
      } else if (!isProcessing) {
        processQueue();
      }
      return true;
    } else {
      console.log("لا توجد صور في قائمة الانتظار أو المعالجة قيد التقدم بالفعل");
      return false;
    }
  };

  const { markImageAsProcessed } = useImageStats();
  
  return {
    handleFileChange,
    isProcessing,
    activeUploads,
    queueLength: fileQueue.length,
    useGemini: useGeminiOption,
    setUseGemini: setUseGeminiOption,
    pauseProcessing,
    resumeProcessing,
    clearQueue,
    clearProcessedHashesCache,
    manuallyTriggerProcessingQueue,
    processingError
  };
};
