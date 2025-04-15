import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { compressImage, enhanceImageForOCR } from "@/utils/imageCompression";
import { ImageData, CustomImageData, ImageProcessFn, FileImageProcessFn } from "@/types/ImageData";
import { User } from "@supabase/supabase-js";

interface FileProcessingConfig {
  images: CustomImageData[];
  addImage: (image: CustomImageData) => void;
  updateImage: (id: string, fields: Partial<CustomImageData>) => void;
  processWithOcr: ImageProcessFn;
  processWithGemini: FileImageProcessFn;
  saveProcessedImage?: (image: CustomImageData) => Promise<boolean>;
  user?: User | null;
  // تعديل نوع البيانات هنا ليقبل Promise<string>
  createSafeObjectURL: (file: File | Blob) => Promise<string>;
}

export const useFileProcessing = ({
  images,
  addImage,
  updateImage,
  processWithOcr,
  processWithGemini,
  saveProcessedImage,
  user,
  createSafeObjectURL
}: FileProcessingConfig) => {
  const { toast } = useToast();
  
  // حالة المعالجة
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeUploads, setActiveUploads] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  
  // معالجة ملف واحد
  const processFile = useCallback(async (file: File, batchId?: string) => {
    try {
      // ضغط وتحسين الصورة
      const optimizedFile = await compressImage(file);
      const enhancedFile = await enhanceImageForOCR(optimizedFile);
      
      // إنشاء عنوان URL آمن للمعاينة
      const previewUrl = await createSafeObjectURL(enhancedFile);
      
      // إنشاء كائن بيانات الصورة الأولي
      const imageData: CustomImageData = {
        id: uuidv4(),
        file: enhancedFile,
        date: new Date(),
        number: images.length + 1,
        previewUrl,
        status: 'processing',
        sessionImage: true,
        userId: user?.id,
        batch_id: batchId,
        extractedText: '',
        code: '',
        senderName: '',
        phoneNumber: '',
        province: '',
        price: '',
        companyName: ''
      };
      
      // إضافة الصورة إلى القائمة
      addImage(imageData);
      setActiveUploads(prev => prev + 1);
      
      try {
        // معالجة النص من الصورة باستخدام OCR
        const processedImageData = await processWithOcr(enhancedFile, imageData);
        updateImage(imageData.id, { 
          ...processedImageData, 
          extractedText: processedImageData.extractedText || "" 
        });
        
        // استخراج البيانات باستخدام Gemini
        try {
          const geminiProcessedImage: CustomImageData = await processWithGemini(enhancedFile, {
            ...imageData
          } as CustomImageData);
          
          updateImage(imageData.id, { 
            ...geminiProcessedImage,
            status: 'completed' 
          });
          
          // حفظ الصورة المعالجة إذا كانت الدالة متوفرة
          if (saveProcessedImage) {
            await saveProcessedImage(geminiProcessedImage as CustomImageData);
          }
        } catch (geminiError) {
          console.error("خطأ في معالجة Gemini:", geminiError);
          updateImage(imageData.id, { status: 'completed' });
          
          // حفظ نتائج OCR على الأقل
          if (saveProcessedImage) {
            await saveProcessedImage(processedImageData);
          }
        }
      } catch (error) {
        console.error("خطأ في معالجة الصورة:", error);
        updateImage(imageData.id, { status: 'error' });
      }
      
    } catch (error) {
      console.error("خطأ في معالجة الملف:", error);
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء معالجة الملف",
        variant: "destructive"
      });
    } finally {
      setActiveUploads(prev => prev - 1);
    }
  }, [images, addImage, updateImage, processWithOcr, processWithGemini, saveProcessedImage, user, createSafeObjectURL, toast]);

  // معالجة مجموعة من الملفات
  const handleFileChange = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    
    setIsProcessing(true);
    setQueueLength(fileArray.length);
    
    const batchId = uuidv4();
    
    for (let i = 0; i < fileArray.length; i++) {
      await processFile(fileArray[i], batchId);
      const progress = Math.round(((i + 1) / fileArray.length) * 100);
      setProcessingProgress(progress);
    }
    
    setIsProcessing(false);
    setProcessingProgress(0);
    setQueueLength(0);
    
  }, [processFile]);

  return {
    isProcessing,
    processingProgress,
    activeUploads,
    queueLength,
    handleFileChange
  };
};
