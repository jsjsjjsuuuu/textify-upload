import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { v4 as uuidv4 } from 'uuid';
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, updates: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage: (image: ImageData) => Promise<void>;
}

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const { toast } = useToast();
  const { processWithOcr } = useOcrProcessing();
  const { useGemini, processWithGemini } = useGeminiProcessing();

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({
        title: "لا توجد ملفات",
        description: "الرجاء تحديد ملف واحد على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setActiveUploads(files.length);

    const uploadPromises = Array.from(files).map(async (file, index) => {
      const id = uuidv4();
      const fileNumber = images.length + index + 1;

      // إنشاء كائن الصورة الأولي
      const addedImage: ImageData = {
        id: id,
        fileNumber: fileNumber,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        date: new Date(),
        previewUrl: URL.createObjectURL(file),
        extractedText: "",
        code: "",
        senderName: "",
        phoneNumber: "",
        province: "",
        price: "",
        companyName: "",
        confidence: 0,
        status: "pending",
        submitted: false,
        extractionMethod: "pending"
      };

      addImage(addedImage);

      try {
        const processedImage = await processFile(file, addedImage);
        
        // حفظ الصورة المعالجة في قاعدة البيانات
        await saveProcessedImage(processedImage);
        
        // تحديث حالة المعالجة
        updateImage(processedImage.id, { status: processedImage.status });
        
      } catch (error) {
        console.error("Error processing file:", error);
        updateImage(addedImage.id, {
          status: "error",
          extractedText: `فشل في معالجة الصورة: ${error.message || "خطأ غير معروف"}`
        });
        toast({
          title: "فشل المعالجة",
          description: `فشل في معالجة ${file.name}: ${error.message || "خطأ غير معروف"}`,
          variant: "destructive"
        });
      } finally {
        setActiveUploads(prev => Math.max(0, prev - 1));
        setProcessingProgress(prevProgress => {
          const newProgress = Math.max(0, prevProgress + (100 / files.length));
          return Math.min(newProgress, 100);
        });
      }
    });

    await Promise.all(uploadPromises);
    setIsProcessing(false);
    setProcessingProgress(100);

    // إعادة تعيين التقدم بعد اكتمال المعالجة
    setTimeout(() => {
      setProcessingProgress(0);
    }, 2000);
  }, [addImage, images, saveProcessedImage, setProcessingProgress, toast, updateImage, processWithGemini, processWithOcr, useGemini]);

  const processFile = async (file: File, addedImage: ImageData): Promise<ImageData> => {
    console.log("بدء معالجة ملف:", file.name);

    try {
      // تعيين حالة الصورة إلى معالجة
      let imageToProcess: ImageData = {
        ...addedImage,
        status: "processing",
        extractedText: "جاري معالجة الصورة، يرجى الانتظار..."
      };
      
      // تحديث قائمة الصور بحالة المعالجة
      updateImage(addedImage.id, { 
        status: "processing",
        extractedText: "جاري معالجة الصورة، يرجى الانتظار..." 
      });

      // محاولة معالجة الصورة باستخدام Gemini أولا إذا كان مفعلا
      let processedImage: ImageData;
      
      if (useGemini) {
        console.log("محاولة المعالجة باستخدام Gemini AI");
        try {
          processedImage = await processWithGemini(file, imageToProcess);
          
          // إذا فشلت المعالجة بسبب تجاوز الحصة، حاول استخدام OCR
          if (processedImage.status === "error" && 
              processedImage.extractedText?.includes("تجاوز الحصة")) {
            console.log("فشل Gemini بسبب تجاوز الحصة، جاري محاولة OCR");
            processedImage = await processWithOcr(file, imageToProcess);
          }
        } catch (geminiError) {
          console.error("خطأ في معالجة Gemini، جاري محاولة OCR:", geminiError);
          processedImage = await processWithOcr(file, imageToProcess);
        }
      } else {
        // استخدام OCR فقط
        console.log("معالجة الصورة باستخدام OCR فقط");
        processedImage = await processWithOcr(file, imageToProcess);
      }

      console.log("اكتملت معالجة الصورة:", processedImage.status);
      
      return processedImage;
    } catch (error) {
      console.error("خطأ في معالجة الملف:", error);
      
      // إرجاع الصورة بحالة خطأ
      return {
        ...addedImage,
        status: "error",
        extractedText: `فشل في معالجة الصورة: ${error.message || "خطأ غير معروف"}`
      };
    }
  };

  return { isProcessing, activeUploads, useGemini, handleFileChange };
};
