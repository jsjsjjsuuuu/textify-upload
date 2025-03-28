
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';
import { ImageData } from '@/types/ImageData';
import { extractTextFromImage } from '@/lib/ocrService';
import { geminiExtractData } from '@/lib/gemini/service';
import { parseDataFromOCRText, updateImageWithExtractedData } from '@/utils/imageDataParser';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';

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
  
  const toggleGemini = () => {
    const newValue = !useGemini;
    setUseGemini(newValue);
    localStorage.setItem('use_gemini', newValue.toString());
    
    toast({
      title: newValue ? "تم تفعيل Gemini للتعرف على الصور" : "تم تعطيل Gemini للتعرف على الصور",
      description: newValue ? "سيتم استخدام Gemini AI للتعرف على النصوص والبيانات من الصور" : "سيتم استخدام OCR التقليدي للتعرف على النصوص من الصور",
    });
  };

  const processImageWithOCR = async (file: File, image: ImageData): Promise<ImageData> => {
    try {
      console.log("بدء معالجة الصورة باستخدام OCR التقليدي:", file.name);
      
      // استخراج النص من الصورة
      const result = await extractTextFromImage(file);
      console.log("نتيجة OCR:", { text: result.text.substring(0, 100) + "...", confidence: result.confidence });
      
      // تحليل البيانات من النص المستخرج
      const extractedData = parseDataFromOCRText(result.text);
      console.log("البيانات المستخرجة من OCR:", extractedData);
      
      // تحديث بيانات الصورة بالبيانات المستخرجة
      return updateImageWithExtractedData(
        image, 
        result.text, 
        extractedData,
        result.confidence,
        "ocr"
      );
    } catch (error) {
      console.error("خطأ في معالجة الصورة باستخدام OCR:", error);
      return {
        ...image,
        status: "error",
        extractedText: "حدث خطأ أثناء استخراج النص من الصورة."
      };
    }
  };

  const processImageWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    try {
      console.log("بدء معالجة الصورة باستخدام Gemini AI:", file.name);
      
      // تحويل الصورة إلى قاعدة64 لإرسالها إلى Gemini
      const fileArrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(fileArrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      
      // استخراج البيانات باستخدام Gemini
      const result = await geminiExtractData(
        base64Data, 
        file.type
      );
      
      if (!result || !result.data) {
        console.error("فشل Gemini في استخراج البيانات", result);
        // إذا فشل Gemini، نستخدم OCR التقليدي
        console.log("الرجوع إلى OCR التقليدي بعد فشل Gemini");
        return processImageWithOCR(file, image);
      }
      
      console.log("نتيجة Gemini:", { 
        text: result.extractedText?.substring(0, 100) + "...",
        data: result.data
      });
      
      // تحديث بيانات الصورة بالبيانات المستخرجة من Gemini
      const updatedImage = {
        ...image,
        extractedText: result.extractedText || "",
        code: result.data.code || "",
        senderName: result.data.senderName || "",
        phoneNumber: result.data.phoneNumber || "",
        province: result.data.province || "",
        price: result.data.price || "",
        companyName: result.data.companyName || "",
        confidence: result.confidence || 85,
        status: "completed",
        extractionMethod: "gemini"
      };
      
      return updatedImage;
    } catch (error) {
      console.error("خطأ في معالجة الصورة باستخدام Gemini:", error);
      console.log("الرجوع إلى OCR التقليدي بعد حدوث خطأ في Gemini");
      // إذا حدث خطأ في Gemini، نستخدم OCR التقليدي
      return processImageWithOCR(file, image);
    }
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
        try {
          // عرض تقدم المعالجة
          setProcessingProgress(Math.round((index / files.length) * 50));
          
          // ضغط الصورة قبل المعالجة
          const compressedFile = await compressImage(file);
          
          // إنشاء URL مؤقت للمعاينة
          const previewUrl = URL.createObjectURL(compressedFile);
          
          // إنشاء معرف فريد للصورة
          const id = uuidv4();
          
          // إنشاء كائن بيانات الصورة الأولية
          const newImage: ImageData = {
            id,
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
            ? await processImageWithGemini(compressedFile, newImage)
            : await processImageWithOCR(compressedFile, newImage);
          
          // تحديث تقدم المعالجة
          setProcessingProgress(Math.round(50 + (index / files.length) * 50));
          
          // تحديث بيانات الصورة بالبيانات المستخرجة
          updateImage(id, processedImage);

          // حفظ الصورة المعالجة في قاعدة البيانات إذا كان المستخدم مسجلاً
          await saveProcessedImage(processedImage);
          
          return processedImage;
        } catch (error) {
          console.error(`خطأ في معالجة الملف ${file.name}:`, error);
          // تحديث حالة الصورة إلى خطأ
          updateImage(id, { status: "error" });
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
