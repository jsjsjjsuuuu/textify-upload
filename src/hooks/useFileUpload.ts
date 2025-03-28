import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';
import { ImageData } from '@/types/ImageData';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';
import { useOcrProcessing } from '@/hooks/useOcrProcessing';
import { useGeminiProcessing } from '@/hooks/useGeminiProcessing';

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, updates: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage: (imageData: ImageData) => Promise<void>;
}

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [useGemini, setUseGemini] = useState<boolean>(localStorage.getItem('use_gemini') === 'true');
  const { toast } = useToast();
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini } = useGeminiProcessing();
  
  const toggleGemini = () => {
    const newValue = !useGemini;
    setUseGemini(newValue);
    localStorage.setItem('use_gemini', newValue.toString());
    
    toast({
      title: newValue ? "تم تفعيل Gemini للتعرف على الصور" : "تم تعطيل Gemini للتعرف على الصور",
      description: newValue ? "سيتم استخدام Gemini AI للتعرف على النصوص والبيانات من الصور" : "سيتم استخدام OCR التقليدي للتعرف على النصوص من الصور",
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const files = Array.from(event.target.files);
    
    if (files.length === 0) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // حساب رقم البداية لترقيم الصور
      const startNumber = images.length > 0 
        ? Math.max(...images.map(img => img.number || 0)) + 1 
        : 1;
      
      const batch_id = uuidv4(); // إنشاء معرف دفعة موحد للصور المرفوعة معًا
      
      // إنشاء مصفوفة من وعود معالجة الصور
      const processPromises = files.map(async (file, index) => {
        // إنشاء معرف فريد للصورة خارج كتلة try/catch
        const imageId = uuidv4();
        
        try {
          // عرض تقدم المعالجة
          setProcessingProgress(Math.round((index / files.length) * 50));
          
          // ضغط الصورة قبل المعالجة
          const compressedFile = await compressImage(file);
          
          // إنشاء URL مؤقت للمعاينة
          const previewUrl = URL.createObjectURL(compressedFile);
          
          // إنشاء كائن بيانات الصورة الأولية
          const newImage: ImageData = {
            id: imageId,
            file: compressedFile,
            previewUrl,
            extractedText: "",
            date: new Date(),
            status: "processing",
            number: startNumber + index,
            batch_id,
            retryCount: 0
          };
          
          // إضافة الصورة إلى الحالة
          addImage(newImage);
          
          // معالجة الصورة باستخدام OCR أو Gemini حسب الإعداد
          const processedImage = useGemini 
            ? await processWithGemini(compressedFile, newImage)
            : await processWithOcr(compressedFile, newImage);
          
          // تحديث تقدم المعالجة
          setProcessingProgress(Math.round(50 + (index / files.length) * 50));
          
          // تحديث بيانات الصورة بالبيانات المستخرجة
          updateImage(imageId, processedImage);

          // حفظ الصورة المعالجة في قاعدة البيانات إذا كان المستخدم مسجلاً
          await saveProcessedImage(processedImage);
          
          return processedImage;
        } catch (error) {
          console.error(`خطأ في معالجة الملف ${file.name}:`, error);
          // تحديث حالة الصورة إلى خطأ
          updateImage(imageId, { status: "error" });
          return null;
        }
      });
      
      // انتظار معالجة جميع الصور
      await Promise.all(processPromises);
      
      // إعادة تعيين عنصر الإدخال ليتمكن المستخدم من تحميل نفس الملف مرة أخرى
      if (event.target) {
        event.target.value = "";
      }
      
      // عرض رسالة نجاح
      toast({
        title: "تم معالجة الصور",
        description: `تمت معالجة ${files.length} صورة بنجاح`,
      });
    } catch (error) {
      console.error("خطأ في معالجة الصور:", error);
      toast({
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء معالجة الصور، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  return {
    isProcessing,
    useGemini,
    toggleGemini,
    handleFileChange
  };
};
