
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "@/types/ImageData";
import { compressImage } from "@/utils/imageCompression";

interface UseFileProcessingProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  processWithOcr?: (file: File, image: ImageData) => Promise<ImageData>;
  processWithGemini?: (file: Blob | File, image: ImageData) => Promise<ImageData>;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
  user?: { id: string } | null;
  createSafeObjectURL?: (file: File) => string;
}

export const useFileProcessing = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  processWithOcr,
  processWithGemini,
  saveProcessedImage,
  user,
  createSafeObjectURL
}: UseFileProcessingProps) => {
  // حالة معالجة الملفات
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setLocalProcessingProgress] = useState(0);
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const { toast } = useToast();
  
  // مفتاح لتخزين توقيعات الملفات المعالجة
  const PROCESSED_FILES_KEY = 'processedImageFiles';
  const [processedFileSignatures, setProcessedFileSignatures] = useState<Set<string>>(new Set());

  // استعادة الملفات المعالجة من التخزين المحلي
  useEffect(() => {
    try {
      const storedSignatures = localStorage.getItem(PROCESSED_FILES_KEY);
      if (storedSignatures) {
        const signatures = JSON.parse(storedSignatures);
        setProcessedFileSignatures(new Set(signatures));
      }
    } catch (error) {
      console.error('خطأ في تحميل توقيعات الملفات المعالجة:', error);
    }
  }, []);

  // إنشاء توقيع للملف
  const createFileSignature = useCallback((file: File): string => {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }, []);

  // تسجيل ملف كمعالج
  const markFileAsProcessed = useCallback((file: File): void => {
    const signature = createFileSignature(file);
    setProcessedFileSignatures(prev => {
      const newSet = new Set(prev);
      newSet.add(signature);
      return newSet;
    });

    // حفظ في التخزين المحلي
    try {
      const currentSignatures = localStorage.getItem(PROCESSED_FILES_KEY);
      const signatures = currentSignatures ? JSON.parse(currentSignatures) : [];
      if (!signatures.includes(signature)) {
        signatures.push(signature);
        localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify(signatures));
      }
    } catch (error) {
      console.error('خطأ في حفظ توقيع الملف:', error);
    }
  }, [createFileSignature]);

  // معالجة طابور الملفات
  const processQueue = useCallback(async () => {
    if (processingQueue.length === 0) {
      setIsProcessing(false);
      setLocalProcessingProgress(100);
      setProcessingProgress(100);
      setActiveUploads(0);
      return;
    }

    setIsProcessing(true);
    let processed = 0;
    const totalFiles = processingQueue.length;

    // معالجة الملفات واحدًا تلو الآخر
    for (const file of processingQueue) {
      try {
        // ضغط الصورة قبل المعالجة
        const compressedFile = await compressImage(file);

        // إنشاء كائن صورة جديد
        const id = uuidv4();
        // استخدام دالة إنشاء URL آمنة إن وجدت
        const previewUrl = createSafeObjectURL ? 
          await createSafeObjectURL(compressedFile) : 
          URL.createObjectURL(compressedFile);
        
        const newImage: ImageData = {
          id,
          file: compressedFile,
          previewUrl,
          date: new Date(),
          status: "pending",
          user_id: user?.id,
          batch_id: `batch-${Date.now()}`,
          sessionImage: true
        };

        // إضافة الصورة إلى المجموعة
        addImage(newImage);
        
        // تحديث حالة المعالجة
        updateImage(id, { status: "processing" });
        
        // معالجة الصورة باستخدام Gemini أولاً إذا متوفر
        if (processWithGemini) {
          try {
            const processedImage = await processWithGemini(compressedFile, newImage);
            updateImage(id, { 
              ...processedImage,
              status: "completed",
            });
            
            // حفظ الصورة المعالجة
            if (saveProcessedImage) {
              await saveProcessedImage(processedImage);
            }
          } catch (geminiError) {
            console.error("خطأ في معالجة الصورة باستخدام Gemini:", geminiError);
            
            // استخدام OCR كخطة بديلة
            if (processWithOcr) {
              try {
                const processedImage = await processWithOcr(compressedFile, newImage);
                updateImage(id, { 
                  ...processedImage,
                  status: "completed",
                });
                
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
            } else {
              // ليس هناك طريقة بديلة متاحة
              updateImage(id, { 
                status: "error", 
                extractedText: "فشلت معالجة الصورة باستخدام Gemini." 
              });
            }
          }
        } 
        // استخدام OCR إذا Gemini غير متوفر
        else if (processWithOcr) {
          try {
            const processedImage = await processWithOcr(compressedFile, newImage);
            updateImage(id, { 
              ...processedImage,
              status: "completed",
            });
            
            if (saveProcessedImage) {
              await saveProcessedImage(processedImage);
            }
          } catch (error) {
            console.error("فشل في معالجة الصورة باستخدام OCR:", error);
            updateImage(id, { 
              status: "error", 
              extractedText: "فشلت معالجة الصورة. يرجى المحاولة مرة أخرى." 
            });
          }
        } else {
          // لا توجد طرق معالجة متاحة
          updateImage(id, { 
            status: "error", 
            extractedText: "لا توجد طرق معالجة متاحة." 
          });
        }

        // تسجيل الملف كمعالج
        markFileAsProcessed(file);
      } catch (error) {
        console.error(`خطأ في معالجة الملف ${file.name}:`, error);
      }

      // تحديث التقدم
      processed++;
      const progress = Math.round((processed / totalFiles) * 100);
      setLocalProcessingProgress(progress);
      setProcessingProgress(progress);
      setActiveUploads(totalFiles - processed);
      
      // إضافة تأخير صغير بين الملفات لتجنب إرهاق الموارد
      if (processed < totalFiles) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // الانتهاء من معالجة الطابور
    setProcessingQueue([]);
    
    // التأخير قليلاً قبل إيقاف المعالجة
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  }, [
    processingQueue,
    addImage,
    updateImage,
    processWithGemini,
    processWithOcr,
    setProcessingProgress,
    saveProcessedImage,
    user,
    markFileAsProcessed,
    createSafeObjectURL
  ]);

  // بدء المعالجة عند إضافة ملفات للطابور
  useEffect(() => {
    if (processingQueue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [processingQueue, isProcessing, processQueue]);

  // وظيفة التعامل مع الملفات المحددة
  const handleFileChange = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    
    // التحقق من أن الملفات عبارة عن صور
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
    
    if (validFiles.length === 0) return;
    
    // إضافة الملفات إلى طابور المعالجة
    setProcessingQueue(prev => [...prev, ...validFiles]);
    setQueueLength(validFiles.length);
    setActiveUploads(validFiles.length);
    
    toast({
      title: "جاري المعالجة",
      description: `تتم معالجة ${validFiles.length} ملف`,
    });
  }, [toast]);

  return {
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange
  };
};
