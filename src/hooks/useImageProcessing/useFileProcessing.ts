
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

interface FileProcessingProps {
  addImage: (newImage: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  processWithOcr: (file: File, image: ImageData) => Promise<ImageData>;
  processWithGemini: (file: Blob | File, image: ImageData) => Promise<ImageData>;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
  checkDuplicateImage?: (image: ImageData, images: ImageData[]) => Promise<boolean>;
  markImageAsProcessed?: (image: ImageData) => void;
  user?: { id: string } | null;
  images: ImageData[];
  createSafeObjectURL?: (file: File) => string; // إضافة دالة إنشاء عناوين URL آمنة
}

export const useFileProcessing = ({
  addImage,
  updateImage,
  processWithOcr,
  processWithGemini,
  saveProcessedImage,
  checkDuplicateImage,
  markImageAsProcessed,
  user,
  images,
  createSafeObjectURL // استقبال الدالة من المستدعي
}: FileProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [imageQueue, setImageQueue] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // دالة لإنشاء عنوان URL آمن للصورة
  const createSafeImageUrl = useCallback((file: File): string => {
    // استخدام الدالة المقدمة من المستدعي إذا كانت موجودة
    if (typeof createSafeObjectURL === 'function') {
      return createSafeObjectURL(file);
    }

    // التنفيذ الافتراضي إذا لم يتم توفير الدالة من الخارج
    try {
      // إنشاء رابط URL للملف في نفس سياق الموقع
      return URL.createObjectURL(file);
    } catch (error) {
      console.error("خطأ في إنشاء عنوان URL للصورة:", error);
      // في حالة الفشل، إنشاء رابط بديل باستخدام Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }) as unknown as string;
    }
  }, [createSafeObjectURL]);

  // معالجة ملف واحد من القائمة - تعطيل فحص التكرار تمامًا
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
    setImageQueue((prevQueue) => prevQueue.slice(1));
    setActiveUploads(1);

    try {
      // تجاهل التحقق من التكرار ومعالجة الصورة مباشرة
      console.log("معالجة الملف:", file.name);

      // إنشاء معرّف فريد للصورة
      const id = uuidv4();
      const batchId = uuidv4();

      // استخدام الدالة الآمنة لإنشاء معاينة للصورة
      const previewUrl = createSafeImageUrl(file);

      // تهيئة كائن الصورة
      const imageData: ImageData = {
        id,
        file,
        previewUrl,
        date: new Date(),
        status: "pending",
        user_id: user?.id,
        batch_id: batchId,
        sessionImage: true
      };

      // إضافة الصورة إلى القائمة بغض النظر عن وجود تكرار
      addImage(imageData);

      // معالجة الصورة
      updateImage(id, { status: "processing" });
      
      // محاولة استخدام Gemini أولاً، ثم OCR إذا فشل
      try {
        // استخدام Gemini للمعالجة
        const processedImage = await processWithGemini(file, imageData);
        
        // تحديث الصورة بالنتائج
        updateImage(id, { 
          ...processedImage,
          status: "completed",
        });
        
        // حفظ الصورة المعالجة إذا كانت الوظيفة متاحة
        if (saveProcessedImage) {
          await saveProcessedImage(processedImage);
        }
      } catch (geminiError) {
        console.error("خطأ في معالجة الصورة باستخدام Gemini:", geminiError);
        
        // محاولة استخدام OCR كخطة بديلة
        try {
          const processedImage = await processWithOcr(file, imageData);
          
          // تحديث الصورة بالنتائج
          updateImage(id, { 
            ...processedImage,
            status: "completed",
          });
          
          // حفظ الصورة المعالجة
          if (saveProcessedImage) {
            await saveProcessedImage(processedImage);
          }
        } catch (ocrError) {
          console.error("فشل في معالجة الصورة باستخدام OCR:", ocrError);
          updateImage(id, { 
            status: "error", 
            extractedText: "فشلت معالجة الصورة. يرجى المحاولة مرة أخرى." 
          });
        }
      }
    } catch (error) {
      console.error(`خطأ في إضافة الملف ${file.name}:`, error);
    } finally {
      // تحديث التقدم
      const progress = Math.min(100, ((queueLength - imageQueue.length + 1) / queueLength) * 100);
      setProcessingProgress(progress);
      
      // معالجة الملف التالي
      processNextFile();
    }
  }, [
    imageQueue, 
    isPaused, 
    addImage, 
    updateImage, 
    images, 
    processWithGemini, 
    processWithOcr, 
    markImageAsProcessed, 
    saveProcessedImage, 
    user, 
    queueLength,
    createSafeImageUrl
  ]);

  useEffect(() => {
    if (imageQueue.length > 0 && !isPaused && !isProcessing) {
      setIsProcessing(true);
      processNextFile();
    }
  }, [imageQueue, isPaused, isProcessing, processNextFile]);

  // معالجة الملفات المحددة - إزالة فحص التكرار
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
      
      // معالجة جميع الملفات - بدون أي تحقق من التكرار
      setImageQueue(prev => [...prev, ...validFiles]);
      setQueueLength(validFiles.length);
      
      toast({
        title: "جاري المعالجة",
        description: `تتم معالجة ${validFiles.length} ملف`,
      });
    },
    [toast]
  );

  // إيقاف المعالجة والتنظيف
  const stopProcessing = useCallback(() => {
    setImageQueue([]);
    setIsProcessing(false);
    setProcessingProgress(0);
    setActiveUploads(0);
  }, []);

  // تصفير حالة المعالجة عندما تكتمل
  useEffect(() => {
    if (processingProgress >= 100 && imageQueue.length === 0 && isProcessing) {
      const timer = setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(100);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [processingProgress, imageQueue.length, isProcessing]);

  return {
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange,
    stopProcessing,
    setProcessingProgress,
    isSubmitting,
    setIsSubmitting,
    createSafeObjectURL: createSafeImageUrl
  };
};
