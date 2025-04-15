
import { useState, useCallback, useRef } from 'react';
import { ImageData, ImageProcessFn } from '@/types/ImageData';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from './use-toast';

interface FileUploadOptions {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, data: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  processWithOcr: ImageProcessFn;
  processWithGemini: ImageProcessFn;
}

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  processWithOcr,
  processWithGemini
}: FileUploadOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const [processingProgress, setProgress] = useState(0);
  const uploadQueue = useRef<File[]>([]);
  const processingRef = useRef<boolean>(false);
  const { toast } = useToast();

  // وظيفة للتعامل مع ملفات متعددة
  const handleFileChange = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    console.log(`تمت إضافة ${fileArray.length} ملفات للمعالجة`);
    
    // إضافة الملفات إلى قائمة الانتظار
    uploadQueue.current = [...uploadQueue.current, ...fileArray];
    
    // بدء المعالجة إذا لم تكن جارية بالفعل
    if (!processingRef.current) {
      setIsProcessing(true);
      processingRef.current = true;
      processNextFile();
    }
  }, []);

  // معالجة الملف التالي في قائمة الانتظار
  const processNextFile = useCallback(async () => {
    // التحقق مما إذا كانت هناك ملفات في قائمة الانتظار
    if (uploadQueue.current.length === 0) {
      console.log("انتهت معالجة جميع الملفات");
      setActiveUploads(0);
      setIsProcessing(false);
      processingRef.current = false;
      setProgress(100);
      return;
    }
    
    setActiveUploads(uploadQueue.current.length);
    
    // استخراج الملف الأول من القائمة
    const file = uploadQueue.current.shift();
    if (!file) {
      processNextFile();
      return;
    }

    try {
      console.log(`بدء معالجة الملف: ${file.name}`);
      
      // إنشاء معرف فريد للصورة
      const id = uuidv4();
      
      // إنشاء عنوان URL للصورة
      const objectUrl = URL.createObjectURL(file);
      
      // إضافة الصورة إلى القائمة بحالة "قيد الانتظار"
      addImage({
        id,
        file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        objectUrl,
        status: "pending",
        processingProgress: 0,
        uploadTimestamp: Date.now()
      });

      // تحديث التقدم
      const updateProgress = (progress: number) => {
        updateImage(id, { processingProgress: progress });
        
        // حساب التقدم الإجمالي للمعالجة
        const totalProgress = (
          ((images.length - uploadQueue.current.length - 1) * 100 + progress) / 
          (images.length - uploadQueue.current.length)
        );
        
        setProgress(Math.min(Math.round(totalProgress), 99));
      };

      // تنفيذ معالجة OCR
      updateImage(id, { status: "processing", processingProgress: 10 });
      console.log("بدء معالجة OCR...");
      const ocrResult = await processWithOcr(file, {}, updateProgress);
      
      // تحديث بيانات الصورة بنتائج OCR
      updateImage(id, { 
        ...ocrResult,
        processingProgress: 60,
        status: "extracted"
      });
      
      // تنفيذ معالجة Gemini
      console.log("بدء معالجة Gemini...");
      const geminiResult = await processWithGemini(file, {}, updateProgress);
      
      // تحديث بيانات الصورة بنتائج Gemini
      updateImage(id, { 
        ...geminiResult,
        processingProgress: 100,
        status: "processed",
        processingTime: Date.now() - (images.find(img => img.id === id)?.uploadTimestamp || Date.now())
      });
      
      console.log(`اكتملت معالجة الملف: ${file.name}`);
    } catch (error) {
      console.error(`خطأ أثناء معالجة الملف: ${file.name}`, error);
      toast({
        title: "خطأ في المعالجة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
    }
    
    // معالجة الملف التالي
    processNextFile();
  }, [images, addImage, updateImage, processWithOcr, processWithGemini, toast]);

  // وظيفة تنظيف التكرارات
  const cleanupDuplicates = useCallback(() => {
    // تنفيذ عملية تنظيف التكرارات هنا
    // تم تحسين هذه العملية في هوك useImageState
    console.log("تم تفعيل وظيفة تنظيف التكرارات");
  }, []);

  return {
    isProcessing,
    handleFileChange,
    activeUploads,
    processingProgress,
    queueLength: uploadQueue.current.length,
    cleanupDuplicates
  };
};
