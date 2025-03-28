
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useDataFormatting } from "@/hooks/useDataFormatting";
import { createReliableBlobUrl } from "@/lib/gemini/utils";
import { saveToLocalStorage } from "@/utils/bookmarklet";
import { useAuth } from "@/contexts/AuthContext";

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
}

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { formatPhoneNumber, formatPrice } = useDataFormatting();

  const handleFileChange = async (files: FileList | null) => {
    console.log("معالجة الملفات:", files?.length);
    if (!files || files.length === 0) {
      console.log("لم يتم اختيار ملفات");
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    console.log("معالجة", fileArray.length, "ملفات");
    
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    
    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    console.log("رقم بداية الصور الجديدة:", startingNumber);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      console.log("معالجة الملف:", file.name, "النوع:", file.type);
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى تحميل صور فقط",
          variant: "destructive"
        });
        console.log("الملف ليس صورة، تخطي");
        continue;
      }
      
      // التحقق من تكرار اسم الملف
      const isDuplicate = images.some(img => img.file.name === file.name);
      if (isDuplicate) {
        toast({
          title: "صورة مكررة",
          description: `الصورة ${file.name} موجودة بالفعل وتم تخطيها`,
          variant: "default"
        });
        console.log("تم تخطي صورة مكررة:", file.name);
        continue;
      }
      
      // إنشاء عنوان URL أكثر موثوقية للكائن
      const previewUrl = createReliableBlobUrl(file);
      console.log("تم إنشاء عنوان URL للمعاينة:", previewUrl);
      
      if (!previewUrl) {
        toast({
          title: "خطأ في تحميل الصورة",
          description: "فشل في إنشاء معاينة للصورة",
          variant: "destructive"
        });
        continue;
      }
      
      const newImage: ImageData = {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        extractedText: "",
        date: new Date(),
        status: "processing",
        number: startingNumber + i,
        user_id: user?.id // إضافة معرف المستخدم للصورة الجديدة
      };
      
      addImage(newImage);
      console.log("تمت إضافة صورة جديدة إلى الحالة بالمعرف:", newImage.id);
      
      try {
        // استخدام Gemini فقط للمعالجة
        console.log("استخدام Gemini API للاستخراج");
        const processedImage = await processWithGemini(file, newImage);
        
        // إذا كان هناك سعر، نتأكد من تنسيقه بشكل صحيح
        if (processedImage.price) {
          const originalPrice = processedImage.price;
          processedImage.price = formatPrice(originalPrice);
          
          if (originalPrice !== processedImage.price) {
            console.log(`تم تنسيق السعر تلقائيًا بعد المعالجة: "${originalPrice}" -> "${processedImage.price}"`);
          }
        }
        
        // تنظيف رقم الهاتف تلقائيًا بعد المعالجة
        if (processedImage.phoneNumber) {
          const originalPhone = processedImage.phoneNumber;
          processedImage.phoneNumber = formatPhoneNumber(originalPhone);
          
          if (originalPhone !== processedImage.phoneNumber) {
            console.log(`تم تنظيف رقم الهاتف تلقائيًا بعد المعالجة: "${originalPhone}" -> "${processedImage.phoneNumber}"`);
          }
        }
        
        // تحديث حالة الصورة إلى "مكتملة" إذا كانت تحتوي على جميع البيانات الأساسية
        if (processedImage.code && processedImage.senderName && processedImage.phoneNumber) {
          processedImage.status = "completed";
        } else if (processedImage.status !== "error") {
          processedImage.status = "pending";
        }
        
        // إضافة معرف المستخدم للصورة
        if (user) {
          processedImage.user_id = user.id;
        }
        
        updateImage(newImage.id, processedImage);
        console.log("تم تحديث الصورة بالبيانات المستخرجة:", newImage.id);
      } catch (error) {
        console.error("خطأ عام في معالجة الصورة:", error);
        updateImage(newImage.id, { status: "error" });
        
        toast({
          title: "فشل في استخراج النص",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive"
        });
      }
      
      processedFiles++;
      const progress = Math.round(processedFiles / totalFiles * 100);
      console.log("تقدم المعالجة:", progress + "%");
      setProcessingProgress(progress);
    }
    
    setIsProcessing(false);
    console.log("اكتملت معالجة الصور");
    
    if (processedFiles > 0) {
      // تم إزالة التنبيه هنا حتى لا تظهر إشعارات إضافية
      
      // تحديث إحصائيات التخزين
      console.log("إعادة حفظ البيانات في localStorage");
      const completedImages = images.filter(img => 
        img.status === "completed" && img.code && img.senderName && img.phoneNumber
      );
      
      if (completedImages.length > 0) {
        saveToLocalStorage(completedImages);
      }
    }
  };

  return {
    isProcessing,
    useGemini,
    handleFileChange
  };
};
