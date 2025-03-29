
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

  // إضافة صورة إلى قائمة الانتظار
  const addToQueue = useCallback((id: string, image: ImageData, process: () => Promise<void>) => {
    queue.current.push({ id, image, process });
    setQueueLength(queue.current.length);
    
    // إذا لم تكن هناك معالجة جارية، ابدأ معالجة القائمة
    if (!isProcessing) {
      processQueue();
    }
  }, [isProcessing]);

  // معالجة الصورة التالية في قائمة الانتظار
  const processQueue = useCallback(async () => {
    if (queue.current.length === 0) {
      setIsProcessing(false);
      setActiveUploads(0);
      return;
    }

    setIsProcessing(true);
    setActiveUploads(1); // دائمًا معالجة صورة واحدة في المرة

    try {
      const item = queue.current[0];
      console.log(`بدء معالجة الصورة: ${item.id}, المتبقي في القائمة: ${queue.current.length - 1}`);
      
      await item.process();
      
      // إزالة العنصر من القائمة بعد المعالجة الناجحة
      queue.current.shift();
      setQueueLength(queue.current.length);
      
      console.log(`تمت معالجة الصورة: ${item.id}, المتبقي في القائمة: ${queue.current.length}`);
      
      // التأخير بين كل صورة والأخرى لتجنب التحميل الزائد
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        }, 1000);
      } else {
        // إذا لم يكن هناك المزيد من الصور، قم بإيقاف المعالجة
        setIsProcessing(false);
        setActiveUploads(0);
      }
    }
  }, [toast]);

  // إعادة تشغيل المعالجة يدويًا إذا توقفت
  const manuallyTriggerProcessingQueue = useCallback(() => {
    if (queue.current.length > 0 && !isProcessing) {
      console.log("إعادة تشغيل معالجة قائمة الصور يدويًا");
      processQueue();
    } else {
      console.log("لا توجد صور في قائمة الانتظار أو المعالجة قيد التقدم بالفعل");
    }
  }, [isProcessing, processQueue]);

  // مسح قائمة الانتظار
  const clearQueue = useCallback(() => {
    queue.current = [];
    setQueueLength(0);
    setIsProcessing(false);
    setActiveUploads(0);
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
