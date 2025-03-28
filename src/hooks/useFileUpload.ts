
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
import { compressImage, enhanceImageForOCR } from "@/utils/imageCompression";
import { enhancePhoneNumber, formatIraqiPhoneNumber } from "@/utils/phoneNumberUtils";

interface UseFileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, fields: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage?: (image: ImageData) => Promise<void>;
}

const MAX_CONCURRENT_UPLOADS = 3; // عدد التحميلات المتزامنة المسموح بها
const MAX_RETRIES = 2;           // الحد الأقصى لإعادة المحاولات

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage
}: UseFileUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0); // تتبع عدد التحميلات النشطة
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { formatPhoneNumber, formatPrice } = useDataFormatting();

  // وظيفة جديدة لرفع الصورة إلى Supabase Storage
  const uploadImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      // ضغط الصورة قبل التحميل للتخزين
      const compressedFile = await compressImage(file);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      const storagePath = `${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('receipt_images')
        .upload(storagePath, compressedFile);
      
      if (error) {
        console.error("خطأ في رفع الصورة إلى التخزين:", error);
        return null;
      }

      return storagePath;
    } catch (error) {
      console.error("خطأ أثناء رفع الصورة:", error);
      return null;
    }
  };

  // معالجة ملف واحد
  const processFile = async (
    file: File, 
    startingNumber: number, 
    index: number, 
    batchId: string, 
    retryCount = 0
  ): Promise<boolean> => {
    try {
      console.log(`معالجة الملف [${index}]: ${file.name}, النوع: ${file.type}, المحاولة: ${retryCount + 1}`);
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى تحميل صور فقط",
          variant: "destructive"
        });
        console.log("الملف ليس صورة، تخطي");
        return false;
      }
      
      // تحسين الصورة للتعرف على النصوص
      const enhancedFile = await enhanceImageForOCR(file);
      console.log(`تم تحسين الصورة: ${file.name}, الحجم قبل: ${(file.size / 1024).toFixed(2)}KB, بعد: ${(enhancedFile.size / 1024).toFixed(2)}KB`);
      
      // إنشاء عنوان URL مؤقت للعرض المبدئي
      const tempPreviewUrl = createReliableBlobUrl(enhancedFile);
      console.log("تم إنشاء عنوان URL مؤقت للمعاينة:", tempPreviewUrl?.substring(0, 50) + "...");
      
      if (!tempPreviewUrl) {
        toast({
          title: "خطأ في تحميل الصورة",
          description: "فشل في إنشاء معاينة للصورة",
          variant: "destructive"
        });
        return false;
      }
      
      // رفع الصورة إلى Supabase Storage
      const storagePath = await uploadImageToStorage(enhancedFile, user.id);
      console.log("تم رفع الصورة إلى التخزين، المسار:", storagePath);
      
      if (!storagePath) {
        toast({
          title: "خطأ في رفع الصورة",
          description: "فشل في تخزين الصورة على الخادم",
          variant: "destructive"
        });
        return false;
      }
      
      // الحصول على رابط URL العام للصورة
      const { data: publicUrlData } = supabase.storage
        .from('receipt_images')
        .getPublicUrl(storagePath);
      
      const previewUrl = publicUrlData.publicUrl;
      
      // إضافة الصورة إلى القائمة مع حالة "processing"
      const imageId = crypto.randomUUID();
      const newImage: ImageData = {
        id: imageId,
        file: enhancedFile,
        previewUrl,
        extractedText: "",
        date: new Date(),
        status: "processing",
        number: startingNumber + index,
        user_id: user.id,
        batch_id: batchId,
        storage_path: storagePath,
        retryCount: retryCount
      };
      
      addImage(newImage);
      console.log("تمت إضافة صورة جديدة إلى الحالة بالمعرف:", newImage.id);
      
      try {
        // استخدام Gemini للمعالجة
        console.log("استخدام Gemini API للاستخراج");
        const processedImage = await processWithGemini(enhancedFile, newImage);
        
        // تنظيف وتحسين رقم الهاتف تلقائيًا بعد المعالجة
        if (processedImage.phoneNumber) {
          const originalPhone = processedImage.phoneNumber;
          
          // استخدام الدالة المحسنة لتنسيق رقم الهاتف
          processedImage.phoneNumber = formatIraqiPhoneNumber(originalPhone);
          
          // تحسين رقم الهاتف باستخدام سياق النص المستخرج
          processedImage.phoneNumber = enhancePhoneNumber(
            processedImage.phoneNumber, 
            processedImage.extractedText || ""
          );
          
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
        
        // إضافة معلومات إضافية
        processedImage.user_id = user.id;
        processedImage.storage_path = storagePath;
        processedImage.retryCount = retryCount;
        
        // تحديث الصورة بالبيانات المستخرجة
        updateImage(imageId, processedImage);
        console.log("تم تحديث الصورة بالبيانات المستخرجة:", imageId);
        
        return true;
      } catch (error) {
        console.error("خطأ في معالجة الصورة:", error);
        
        // إعادة المحاولة إذا كان عدد المحاولات أقل من الحد الأقصى
        if (retryCount < MAX_RETRIES) {
          console.log(`إعادة محاولة معالجة الصورة (${retryCount + 1}/${MAX_RETRIES})`);
          
          // تحديث حالة الصورة إلى "جاري إعادة المحاولة"
          updateImage(imageId, { 
            status: "pending",
            extractedText: `فشل في المحاولة ${retryCount + 1}. جاري إعادة المحاولة...`
          });
          
          // إعادة المحاولة بعد تأخير قصير
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return await processFile(file, startingNumber, index, batchId, retryCount + 1);
        }
        
        // إذا استنفدت جميع المحاولات، حدّث الحالة إلى "خطأ"
        updateImage(imageId, { 
          status: "error",
          extractedText: `فشل في المعالجة بعد ${MAX_RETRIES + 1} محاولات. ${error.message || "خطأ غير معروف"}`
        });
        
        toast({
          title: "فشل في استخراج النص",
          description: `حدث خطأ أثناء معالجة الصورة ${index + 1} بعد ${MAX_RETRIES + 1} محاولات.`,
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error) {
      console.error("خطأ عام في عملية المعالجة:", error);
      return false;
    }
  };

  // معالجة الصور بشكل متوازي
  const processFilesInParallel = async (
    files: File[], 
    startingNumber: number, 
    batchId: string
  ) => {
    const totalFiles = files.length;
    let completedFiles = 0;
    let queue = [...files];
    
    // تعريف وظيفة لمعالجة الصور التالية من القائمة
    const processNext = async () => {
      if (queue.length === 0) return;
      
      // أخذ الملف التالي من القائمة
      const nextFile = queue.shift();
      if (!nextFile) return;
      
      // زيادة عدد التحميلات النشطة
      setActiveUploads(prev => prev + 1);
      
      // الحصول على مؤشر الملف الأصلي
      const fileIndex = files.indexOf(nextFile);
      
      try {
        // معالجة الملف
        await processFile(nextFile, startingNumber, fileIndex, batchId);
      } finally {
        // تقليل عدد التحميلات النشطة
        setActiveUploads(prev => prev - 1);
        
        // زيادة عدد الملفات المكتملة وتحديث التقدم
        completedFiles++;
        const progress = Math.round(completedFiles / totalFiles * 100);
        setProcessingProgress(progress);
        
        // معالجة الملف التالي
        processNext();
      }
    };
    
    // بدء معالجة عدة ملفات في وقت واحد (حسب الحد الأقصى المحدد)
    const initialProcesses = Math.min(MAX_CONCURRENT_UPLOADS, files.length);
    const initialProcessPromises = [];
    
    for (let i = 0; i < initialProcesses; i++) {
      initialProcessPromises.push(processNext());
    }
    
    // انتظار اكتمال جميع العمليات
    await Promise.all(initialProcessPromises);
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
    
    // التحقق من الملفات المكررة
    const uniqueFiles = fileArray.filter(file => {
      const isDuplicate = images.some(img => img.file.name === file.name);
      if (isDuplicate) {
        console.log("تم تخطي صورة مكررة:", file.name);
      }
      return !isDuplicate;
    });
    
    if (uniqueFiles.length < fileArray.length) {
      toast({
        title: "تم تخطي الصور المكررة",
        description: `تم تخطي ${fileArray.length - uniqueFiles.length} صور مكررة`,
        variant: "default"
      });
    }
    
    if (uniqueFiles.length === 0) {
      setIsProcessing(false);
      return;
    }
    
    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    console.log("رقم بداية الصور الجديدة:", startingNumber);
    
    // إنشاء معرف فريد للدفعة لربط الصور المرفوعة معًا
    const batchId = uuidv4();
    console.log("إنشاء معرف دفعة جديد:", batchId);
    
    try {
      // معالجة الملفات بشكل متوازي
      await processFilesInParallel(uniqueFiles, startingNumber, batchId);
      
      // تحديث إحصائيات التخزين
      console.log("إعادة حفظ البيانات في localStorage");
      const completedImages = images.filter(img => 
        img.status === "completed" && img.code && img.senderName && img.phoneNumber
      );
      
      if (completedImages.length > 0) {
        saveToLocalStorage(completedImages);
      }
    } catch (error) {
      console.error("خطأ أثناء معالجة الملفات:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الصور",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActiveUploads(0);
    }
  };

  return {
    isProcessing,
    useGemini,
    handleFileChange,
    activeUploads
  };
};
