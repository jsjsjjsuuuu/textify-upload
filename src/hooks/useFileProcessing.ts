
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/utils/imageCompression";

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
  createSafeObjectURL?: (file: File) => string;
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
  createSafeObjectURL: externalCreateSafeObjectURL
}: FileProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [imageQueue, setImageQueue] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // دالة لإنشاء عنوان Data URL للصورة (تفادي مشاكل blob URLs)
  const createSafeObjectURL = useCallback((file: File): string => {
    // استخدام الدالة الخارجية إن وجدت
    if (typeof externalCreateSafeObjectURL === 'function') {
      return externalCreateSafeObjectURL(file);
    }
    
    // استخدام URL.createObjectURL لسرعته وكفاءته بدلاً من FileReader
    return URL.createObjectURL(file);
  }, [externalCreateSafeObjectURL]);

  // تنظيف عناوين URL عند إزالة المكون
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  // معالجة ملف واحد من القائمة - تم تحسين الأداء وتقليل الوقت
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
      console.log("معالجة الملف:", file.name);

      // ضغط الصورة للتحسين من الأداء (جديد)
      const compressedFile = await compressImage(file);

      // إنشاء معرّف فريد للصورة
      const id = uuidv4();
      const batchId = uuidv4();

      // إنشاء URL مباشر للمعاينة (تحسين)
      const previewUrl = createSafeObjectURL(compressedFile);

      // تهيئة كائن الصورة
      const imageData: ImageData = {
        id,
        file: compressedFile,
        previewUrl,
        date: new Date(),
        status: "pending",
        user_id: user?.id,
        batch_id: batchId,
        sessionImage: true
      };

      // إضافة الصورة إلى القائمة
      addImage(imageData);

      // معالجة الصورة
      updateImage(id, { status: "processing" });
      
      // استخدام معالجة متوازية للصورة (تحسين)
      try {
        // معالجة باستخدام Gemini بشكل متوازي
        const processedImage = await Promise.race([
          processWithGemini(compressedFile, imageData),
          // إنشاء مهلة زمنية لتفادي الانتظار الطويل
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("مهلة معالجة Gemini")), 15000)
          )
        ]);
        
        // تحديث الصورة بالنتائج
        updateImage(id, { 
          ...processedImage,
          status: "completed",
        });
        
        // حفظ الصورة المعالجة (بشكل غير متزامن)
        if (saveProcessedImage) {
          saveProcessedImage(processedImage).catch(error => 
            console.error("خطأ في حفظ الصورة:", error)
          );
        }
      } catch (geminiError) {
        console.error("محاولة استخدام OCR كخطة بديلة:", geminiError);
        
        try {
          const processedImage = await processWithOcr(compressedFile, imageData);
          
          updateImage(id, { 
            ...processedImage,
            status: "completed",
          });
          
          if (saveProcessedImage) {
            saveProcessedImage(processedImage).catch(error => 
              console.error("خطأ في حفظ الصورة بعد OCR:", error)
            );
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
      
      // معالجة الملف التالي (بدون انتظار)
      setTimeout(processNextFile, 0);
    }
  }, [
    imageQueue, 
    isPaused, 
    addImage, 
    updateImage, 
    processWithGemini, 
    processWithOcr, 
    saveProcessedImage, 
    user, 
    queueLength,
    createSafeObjectURL
  ]);

  // تحسين إدارة معالجة المهام وتنفيذها بشكل غير متزامن
  useEffect(() => {
    if (imageQueue.length > 0 && !isPaused && !isProcessing) {
      setIsProcessing(true);
      setTimeout(processNextFile, 0);
    }
  }, [imageQueue, isPaused, isProcessing, processNextFile]);

  // تحسين معالجة الملفات المتعددة - إضافة حد أقصى للملفات المعالجة في المرة الواحدة
  const handleFileChange = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      
      // تقييد عدد الملفات (تحسين)
      const maxFiles = 10;
      const filesToProcess = files.length > maxFiles ? files.slice(0, maxFiles) : files;
      
      if (files.length > maxFiles) {
        toast({
          title: "تم تقييد عدد الملفات",
          description: `تم اختيار معالجة ${maxFiles} ملف فقط من أصل ${files.length} للحفاظ على الأداء`,
        });
      }
      
      // منع تحميل الملفات غير المدعومة
      const validFiles = filesToProcess.filter(file => {
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
      
      // معالجة الملفات المنتقاة
      setImageQueue(prev => [...prev, ...validFiles]);
      setQueueLength(prev => prev + validFiles.length);
      
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

  // تنظيف وإنهاء المعالجة
  useEffect(() => {
    if (processingProgress >= 100 && imageQueue.length === 0 && isProcessing) {
      const timer = setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(100);
      }, 300); // تسريع وقت الإنهاء
      
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
    createSafeObjectURL
  };
};
