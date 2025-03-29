
import { useState, useCallback, useRef } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

/**
 * هذا الملف مسؤول عن إدارة قائمة انتظار الصور ومعالجتها بالتسلسل
 */
export const useImageQueue = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [activeUploads, setActiveUploads] = useState(0);
  const queue = useRef<{
    id: string;
    image: ImageData;
    process: () => Promise<void>;
  }[]>([]);
  const { toast } = useToast();
  const processingRef = useRef<boolean>(false); // مرجع لتتبع حالة المعالجة الفعلية

  // إضافة صورة إلى قائمة الانتظار
  const addToQueue = useCallback((id: string, image: ImageData, process: () => Promise<void>) => {
    console.log(`إضافة الصورة ${id} إلى قائمة الانتظار`);
    queue.current.push({ id, image, process });
    setQueueLength(queue.current.length);
    
    // إذا لم تكن هناك معالجة جارية، ابدأ معالجة القائمة
    if (!processingRef.current) {
      processQueue();
    }
  }, []);

  // معالجة الصورة التالية في قائمة الانتظار
  const processQueue = useCallback(async () => {
    // التحقق من وجود عناصر في القائمة
    if (queue.current.length === 0) {
      console.log("قائمة المعالجة فارغة، توقف عن المعالجة");
      setIsProcessing(false);
      setActiveUploads(0);
      processingRef.current = false;
      return;
    }

    // تعيين حالة المعالجة إلى نشطة
    setIsProcessing(true);
    processingRef.current = true;
    setActiveUploads(1); // دائمًا معالجة صورة واحدة في المرة

    try {
      // الحصول على العنصر الأول من القائمة
      const item = queue.current[0];
      console.log(`بدء معالجة الصورة: ${item.id}, المتبقي في القائمة: ${queue.current.length - 1}`);
      
      // معالجة الصورة
      await item.process();
      
      // إزالة العنصر من القائمة بعد المعالجة الناجحة
      queue.current.shift();
      setQueueLength(queue.current.length);
      
      console.log(`تمت معالجة الصورة بنجاح: ${item.id}, المتبقي في القائمة: ${queue.current.length}`);
      
      // التأخير بين كل صورة والأخرى لتجنب التحميل الزائد وإعطاء فرصة لعرض البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // معالجة الصورة التالية
      processQueue();
    } catch (error) {
      console.error("خطأ في معالجة قائمة الصور:", error);
      
      // محاولة إزالة العنصر الحالي وتجربة التالي
      if (queue.current.length > 0) {
        const failedItem = queue.current.shift();
        setQueueLength(queue.current.length);
        
        toast({
          title: "خطأ في المعالجة",
          description: `فشلت معالجة الصورة ${failedItem?.id}. جاري الانتقال إلى الصورة التالية.`,
          variant: "destructive"
        });
        
        // الانتقال إلى الصورة التالية بعد فترة قصيرة
        setTimeout(() => {
          processQueue();
        }, 1500);
      } else {
        // إذا لم يكن هناك المزيد من الصور، قم بإيقاف المعالجة
        setIsProcessing(false);
        setActiveUploads(0);
        processingRef.current = false;
      }
    }
  }, [toast]);

  // إعادة تشغيل المعالجة يدويًا إذا توقفت
  const manuallyTriggerProcessingQueue = useCallback(() => {
    if (queue.current.length > 0 && !processingRef.current) {
      console.log("إعادة تشغيل معالجة قائمة الصور يدويًا");
      processQueue();
      return true;
    } else {
      console.log("لا توجد صور في قائمة الانتظار أو المعالجة قيد التقدم بالفعل");
      return false;
    }
  }, [processQueue]);

  // مسح قائمة الانتظار
  const clearQueue = useCallback(() => {
    queue.current = [];
    setQueueLength(0);
    setIsProcessing(false);
    setActiveUploads(0);
    processingRef.current = false;
  }, []);

  return {
    addToQueue,
    isProcessing,
    queueLength,
    activeUploads,
    manuallyTriggerProcessingQueue,
    clearQueue
  };
};
