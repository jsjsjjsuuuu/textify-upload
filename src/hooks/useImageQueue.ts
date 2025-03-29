
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
  // إضافة مرجع للتحكم في حالة التوقف
  const isStopped = useRef<boolean>(false);
  // إضافة مرجع لتتبع آخر صورة تمت معالجتها
  const lastProcessedId = useRef<string | null>(null);
  // إضافة مرجع لحالة المعالجة المثابرة
  const processingState = useRef<{
    inProgress: boolean;
    currentItemId: string | null;
    startTime: number | null;
    timeoutId: number | null;
    // إضافة متغيرات جديدة لمعالجة التوقفات والتجميد
    lastActivityTime: number;
    isStalled: boolean;
    stallDetectionTimer: number | null;
  }>({
    inProgress: false,
    currentItemId: null,
    startTime: null,
    timeoutId: null,
    lastActivityTime: Date.now(),
    isStalled: false,
    stallDetectionTimer: null
  });

  // وظيفة للكشف عن تجميد المعالجة
  const setupStallDetection = useCallback(() => {
    // إلغاء المؤقت السابق إن وجد
    if (processingState.current.stallDetectionTimer) {
      clearTimeout(processingState.current.stallDetectionTimer);
    }

    // إعداد المؤقت الجديد - 30 ثانية للكشف عن التجميد
    const timerId = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - processingState.current.lastActivityTime;
      console.log(`الوقت منذ آخر نشاط: ${timeSinceLastActivity}ms`);
      
      // إذا لم يكن هناك نشاط لمدة 30 ثانية، نفترض أن المعالجة قد تجمدت
      if (timeSinceLastActivity > 30000 && processingState.current.inProgress) {
        console.log(`تم الكشف عن تجميد المعالجة للعنصر: ${processingState.current.currentItemId}`);
        
        // وضع علامة على حالة المعالجة كمتجمدة
        processingState.current.isStalled = true;
        
        // محاولة استئناف المعالجة عن طريق تخطي العنصر الحالي
        recoverFromStall();
      }
    }, 30000) as unknown as number;
    
    processingState.current.stallDetectionTimer = timerId;
  }, []);

  // وظيفة للتعافي من التجميد
  const recoverFromStall = useCallback(() => {
    console.log("محاولة التعافي من تجميد المعالجة...");
    
    // إلغاء المؤقت الحالي إن وجد
    if (processingState.current.timeoutId) {
      clearTimeout(processingState.current.timeoutId);
      processingState.current.timeoutId = null;
    }
    
    // إعادة ضبط حالة المعالجة
    processingState.current.inProgress = false;
    processingState.current.isStalled = false;
    
    // تخطي العنصر الحالي إذا كان موجودًا في القائمة
    if (queue.current.length > 0 && processingState.current.currentItemId) {
      const currentItemIndex = queue.current.findIndex(item => item.id === processingState.current.currentItemId);
      
      if (currentItemIndex >= 0) {
        const skippedItem = queue.current.splice(currentItemIndex, 1)[0];
        console.log(`تم تخطي العنصر المتجمد: ${skippedItem.id}`);
        setQueueLength(queue.current.length);
        
        toast({
          title: "تنبيه",
          description: `تم تخطي معالجة صورة متجمدة. سيتم استئناف المعالجة للصور الأخرى.`,
          variant: "default"
        });
      }
    }
    
    // إعادة تعيين المعرف الحالي
    processingState.current.currentItemId = null;
    processingState.current.startTime = null;
    
    // تحديث وقت آخر نشاط
    processingState.current.lastActivityTime = Date.now();
    
    // إعادة تشغيل المعالجة
    setTimeout(() => {
      processQueue();
    }, 2000);
  }, [toast]);

  // إضافة صورة إلى قائمة الانتظار
  const addToQueue = useCallback((id: string, image: ImageData, process: () => Promise<void>) => {
    // تحديث قيمة آخر نشاط
    processingState.current.lastActivityTime = Date.now();
    
    // إذا كانت هناك معالجة متجمدة، حاول التعافي منها أولاً
    if (processingState.current.isStalled) {
      recoverFromStall();
    }
    
    queue.current.push({ id, image, process });
    setQueueLength(queue.current.length);
    
    // إذا لم تكن هناك معالجة جارية، ابدأ معالجة القائمة
    if (!isProcessing) {
      isStopped.current = false; // إعادة ضبط حالة التوقف
      processQueue();
    }
  }, [isProcessing, recoverFromStall]);

  // إضافة وظيفة للتأخير المضمون بين المعالجات
  const delayBetweenProcessing = useCallback((delay: number) => {
    return new Promise<void>(resolve => {
      console.log(`تأخير ${delay}ms قبل معالجة الصورة التالية...`);
      const timeoutId = setTimeout(() => {
        resolve();
      }, delay);
      
      processingState.current.timeoutId = timeoutId as unknown as number;
    });
  }, []);

  // إضافة وظيفة إلغاء المعالجة الحالية
  const cancelCurrentProcessing = useCallback(() => {
    if (processingState.current.timeoutId) {
      clearTimeout(processingState.current.timeoutId);
      processingState.current.timeoutId = null;
    }
    
    processingState.current.inProgress = false;
    processingState.current.currentItemId = null;
    processingState.current.startTime = null;
  }, []);

  // معالجة الصورة التالية في قائمة الانتظار
  const processQueue = useCallback(async () => {
    // تحديث قيمة آخر نشاط
    processingState.current.lastActivityTime = Date.now();
    
    // إعداد اكتشاف التجميد
    setupStallDetection();
    
    // التحقق من وجود عناصر في القائمة وأن المعالجة غير متوقفة
    if (queue.current.length === 0 || isStopped.current) {
      setIsProcessing(false);
      setActiveUploads(0);
      processingState.current.inProgress = false;
      return;
    }

    // إذا كانت هناك معالجة جارية، لا تبدأ واحدة جديدة
    if (processingState.current.inProgress) {
      console.log(`تخطي بدء معالجة جديدة لأن المعالجة ${processingState.current.currentItemId} جارية بالفعل`);
      return;
    }

    setIsProcessing(true);
    setActiveUploads(1); // تحديث عدد المعالجات النشطة

    try {
      const item = queue.current[0];
      
      // تحديث حالة المعالجة
      processingState.current.inProgress = true;
      processingState.current.currentItemId = item.id;
      processingState.current.startTime = Date.now();
      processingState.current.lastActivityTime = Date.now();
      processingState.current.isStalled = false;
      
      // التحقق مما إذا كانت هذه الصورة هي آخر صورة تمت معالجتها لتجنب المعالجة المتكررة
      if (lastProcessedId.current === item.id) {
        console.log(`تم تخطي الصورة التي تمت معالجتها بالفعل: ${item.id}`);
        queue.current.shift();
        setQueueLength(queue.current.length);
        
        // إعادة ضبط حالة المعالجة
        processingState.current.inProgress = false;
        processingState.current.currentItemId = null;
        
        // تأخير قبل معالجة العنصر التالي للسماح بتحديث واجهة المستخدم
        await delayBetweenProcessing(500);
        
        // الانتقال إلى العنصر التالي في القائمة
        processQueue();
        return;
      }
      
      console.log(`بدء معالجة الصورة: ${item.id}, المتبقي في القائمة: ${queue.current.length - 1}`);
      
      // معالجة العنصر الحالي وانتظار الانتهاء - مع تحديد مهلة زمنية للمعالجة
      const processingTimeout = setTimeout(() => {
        console.log(`تجاوزت معالجة الصورة ${item.id} المهلة المحددة. تخطيها...`);
        // تعيين العنصر الحالي كمعالج لتخطيه في الدورة التالية
        lastProcessedId.current = item.id;
        recoverFromStall();
      }, 45000); // 45 ثانية كحد أقصى لمعالجة الصورة

      try {
        await item.process();
        clearTimeout(processingTimeout);
      } catch (error) {
        clearTimeout(processingTimeout);
        throw error;
      }
      
      // تعيين معرف آخر صورة تمت معالجتها
      lastProcessedId.current = item.id;
      
      // إزالة العنصر من القائمة بعد المعالجة الناجحة
      queue.current.shift();
      setQueueLength(queue.current.length);
      
      // إعادة ضبط حالة المعالجة
      processingState.current.inProgress = false;
      processingState.current.currentItemId = null;
      
      // تحديث وقت آخر نشاط
      processingState.current.lastActivityTime = Date.now();
      
      console.log(`تمت معالجة الصورة: ${item.id}, المتبقي في القائمة: ${queue.current.length}`);
      
      // إضافة تأخير أكبر بين كل معالجة للسماح بتحديث واجهة المستخدم وتجنب تجاوز حدود API
      // زيادة التأخير إلى 3 ثوانٍ بين كل معالجة
      await delayBetweenProcessing(3000);
      
      // الانتقال إلى العنصر التالي في القائمة
      processQueue();
    } catch (error) {
      console.error("خطأ في معالجة قائمة الصور:", error);
      
      // إعادة ضبط حالة المعالجة
      processingState.current.inProgress = false;
      processingState.current.currentItemId = null;
      processingState.current.lastActivityTime = Date.now();
      
      // محاولة إزالة العنصر الفاشل والانتقال للتالي
      if (queue.current.length > 0) {
        const failedItem = queue.current.shift();
        setQueueLength(queue.current.length);
        
        toast({
          title: "خطأ في المعالجة",
          description: `فشلت معالجة الصورة ${failedItem?.id}. جاري الانتقال إلى الصورة التالية.`,
          variant: "destructive"
        });
        
        // الانتقال إلى الصورة التالية بعد فترة أطول
        // زيادة التأخير بعد الفشل إلى 5 ثوانٍ
        setTimeout(() => {
          processQueue();
        }, 5000);
      } else {
        // إيقاف المعالجة إذا لم يكن هناك المزيد من العناصر
        setIsProcessing(false);
        setActiveUploads(0);
      }
    }
  }, [toast, delayBetweenProcessing, recoverFromStall, setupStallDetection]);

  // إعادة تشغيل المعالجة يدويًا إذا توقفت
  const manuallyTriggerProcessingQueue = useCallback(() => {
    // إعادة ضبط حالة التجميد
    processingState.current.isStalled = false;
    processingState.current.lastActivityTime = Date.now();
    
    if (queue.current.length > 0 && !isProcessing) {
      console.log("إعادة تشغيل معالجة قائمة الصور يدويًا");
      isStopped.current = false;
      // إعادة ضبط حالة المعالجة
      processingState.current.inProgress = false;
      processingState.current.currentItemId = null;
      
      processQueue();
      return true;
    } else {
      console.log("لا توجد صور في قائمة الانتظار أو المعالجة قيد التقدم بالفعل");
      return false;
    }
  }, [isProcessing, processQueue]);

  // إيقاف المعالجة مؤقتًا
  const pauseProcessing = useCallback(() => {
    if (isProcessing) {
      isStopped.current = true;
      // إلغاء المعالجة الحالية
      cancelCurrentProcessing();
      
      console.log("تم إيقاف معالجة الصور مؤقتًا");
      toast({
        title: "تم الإيقاف",
        description: "تم إيقاف معالجة الصور مؤقتًا"
      });
      
      setIsProcessing(false);
      setActiveUploads(0);
      return true;
    }
    return false;
  }, [isProcessing, toast, cancelCurrentProcessing]);

  // مسح قائمة الانتظار
  const clearQueue = useCallback(() => {
    queue.current = [];
    setQueueLength(0);
    setIsProcessing(false);
    setActiveUploads(0);
    isStopped.current = true;
    
    // إلغاء المعالجة الحالية
    cancelCurrentProcessing();
    
    // إلغاء مؤقت اكتشاف التجميد
    if (processingState.current.stallDetectionTimer) {
      clearTimeout(processingState.current.stallDetectionTimer);
      processingState.current.stallDetectionTimer = null;
    }
    
    return true;
  }, [cancelCurrentProcessing]);

  // الحصول على معلومات حالة المعالجة الحالية
  const getProcessingState = () => {
    return {
      isProcessing,
      queueLength: queue.current.length,
      activeUploads,
      currentlyProcessing: processingState.current.currentItemId,
      processingTimeInSeconds: processingState.current.startTime 
        ? Math.floor((Date.now() - processingState.current.startTime) / 1000) 
        : 0,
      isStalled: processingState.current.isStalled,
      timeSinceLastActivity: Math.floor((Date.now() - processingState.current.lastActivityTime) / 1000)
    };
  };

  return {
    addToQueue,
    isProcessing,
    queueLength,
    activeUploads,
    manuallyTriggerProcessingQueue,
    pauseProcessing,
    clearQueue,
    getProcessingState
  };
};
