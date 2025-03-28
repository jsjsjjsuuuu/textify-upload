
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useDataFormatting } from "@/hooks/useDataFormatting";
import { createReliableBlobUrl } from "@/lib/gemini/utils";
import { saveToLocalStorage } from "@/utils/bookmarklet/storage";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
}

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { formatPhoneNumber, formatPrice } = useDataFormatting();

  // وظيفة جديدة لرفع الصورة إلى Supabase Storage
  const uploadImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      const storagePath = `${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('receipt_images')
        .upload(storagePath, file);
      
      if (error) {
        console.error("خطأ في رفع الصورة إلى التخزين:", error);
        return null;
      }

      // الحصول على رابط URL العام للصورة
      const { data: publicUrlData } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(storagePath);
      
      return storagePath;
    } catch (error) {
      console.error("خطأ أثناء رفع الصورة:", error);
      return null;
    }
  };

  const handleFileChange = async (files: FileList | null) => {
    console.log("معالجة الملفات:", files?.length);
    if (!files || files.length === 0) {
      console.log("لم يتم اختيار ملفات");
      return;
    }
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً لرفع الصور",
        variant: "destructive"
      });
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
    
    // إنشاء معرف فريد للدفعة لربط الصور المرفوعة معًا
    const batchId = uuidv4();
    console.log("إنشاء معرف دفعة جديد:", batchId);
    
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
      
      // إنشاء عنوان URL مؤقت للعرض المبدئي
      const tempPreviewUrl = createReliableBlobUrl(file);
      console.log("تم إنشاء عنوان URL مؤقت للمعاينة:", tempPreviewUrl);
      
      if (!tempPreviewUrl) {
        toast({
          title: "خطأ في تحميل الصورة",
          description: "فشل في إنشاء معاينة للصورة",
          variant: "destructive"
        });
        continue;
      }
      
      // رفع الصورة إلى Supabase Storage
      const storagePath = await uploadImageToStorage(file, user.id);
      console.log("تم رفع الصورة إلى التخزين، المسار:", storagePath);
      
      if (!storagePath) {
        toast({
          title: "خطأ في رفع الصورة",
          description: "فشل في تخزين الصورة على الخادم",
          variant: "destructive"
        });
        continue;
      }
      
      // الحصول على رابط URL العام للصورة
      const { data: publicUrlData } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(storagePath);
      
      const previewUrl = publicUrlData.publicUrl;
      
      const newImage: ImageData = {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        extractedText: "",
        date: new Date(),
        status: "processing",
        number: startingNumber + i,
        user_id: user.id,
        batch_id: batchId,
        storage_path: storagePath
      };
      
      addImage(newImage);
      console.log("تمت إضافة صورة جديدة إلى الحالة بالمعرف:", newImage.id);
      
      try {
        // استخدام Gemini للمعالجة
        console.log("استخدام Gemini API للاستخراج");
        const processedImage = await processWithGemini(file, newImage);
        
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

        // إضافة مسار التخزين للصورة المعالجة
        processedImage.storage_path = storagePath;
        
        updateImage(newImage.id, processedImage);
        console.log("تم تحديث الصورة بالبيانات المستخرجة:", newImage.id);
        
        // تم إزالة الحفظ التلقائي للصورة في قاعدة البيانات بعد المعالجة
        // الآن سيتم الحفظ فقط عند النقر على زر "إرسال البيانات"
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
    
    // تحديث إحصائيات التخزين
    console.log("إعادة حفظ البيانات في localStorage");
    const completedImages = images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber
    );
    
    if (completedImages.length > 0) {
      saveToLocalStorage(completedImages);
    }
  };

  return {
    isProcessing,
    useGemini,
    handleFileChange
  };
};
