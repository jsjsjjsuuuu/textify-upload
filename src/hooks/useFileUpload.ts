
import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "@/utils/imageCompression";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useImageQueue } from "@/hooks/useImageQueue"; 
import { getApiKeyStats, resetAllApiKeys } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  images: ImageData[];
  addImage: (image: ImageData) => void;
  updateImage: (id: string, data: Partial<ImageData>) => void;
  setProcessingProgress: (progress: number) => void;
  saveProcessedImage: (image: ImageData) => Promise<void>;
  isDuplicateImage: (image: ImageData, images: ImageData[]) => boolean;
  removeDuplicates: () => void;
}

export const useFileUpload = ({
  images,
  addImage,
  updateImage,
  setProcessingProgress,
  saveProcessedImage,
  isDuplicateImage,
  removeDuplicates
}: FileUploadProps) => {
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const { toast } = useToast();
  const { processWithOcr } = useOcrProcessing();
  const { processWithGemini, resetApiKeys } = useGeminiProcessing();
  
  // استخدام نظام قائمة الانتظار
  const { 
    addToQueue, 
    isProcessing, 
    queueLength, 
    activeUploads,
    manuallyTriggerProcessingQueue,
    pauseProcessing,
    clearQueue,
    getProcessingState
  } = useImageQueue();
  
  // كاش لهاشات الصور التي تمت معالجتها لمنع المعالجة المتكررة
  const processedHashes = useRef<Set<string>>(new Set());
  // سجل لتتبع نجاح/فشل المعالجة
  const processingStats = useRef<{
    totalAttempted: number;
    successful: number;
    failed: number;
    lastResetTime: number;
  }>({
    totalAttempted: 0,
    successful: 0,
    failed: 0,
    lastResetTime: Date.now()
  });
  
  // تتبع المحاولات المتكررة لكل صورة
  const retryAttemptsMap = useRef<Map<string, number>>(new Map());
  
  // معلومات حدود التحميل اليومية
  const [uploadLimitInfo, setUploadLimitInfo] = useState<{
    currentCount: number;
    dailyLimit: number;
    remainingUploads: number;
    subscription: string;
  }>({
    currentCount: 0,
    dailyLimit: 3, // الافتراضي للباقة العادية
    remainingUploads: 3,
    subscription: 'standard'
  });
  
  // مسح كاش الهاشات
  const clearProcessedHashesCache = useCallback(() => {
    processedHashes.current.clear();
    // إعادة تعيين الإحصائيات
    processingStats.current = {
      totalAttempted: 0,
      successful: 0,
      failed: 0,
      lastResetTime: Date.now()
    };
    // إعادة تعيين خريطة المحاولات
    retryAttemptsMap.current.clear();
    // إعادة تعيين مفاتيح API
    resetApiKeys();
    
    toast({
      title: "تم المسح",
      description: "تم مسح ذاكرة التخزين المؤقت للصور المجهزة وإعادة تعيين مفاتيح API",
    });
  }, [toast, resetApiKeys]);
  
  // التحقق من حدود التحميل اليومية للمستخدم
  const checkUserUploadLimits = useCallback(async (): Promise<{
    canUpload: boolean;
    currentCount: number;
    dailyLimit: number;
    remainingUploads: number;
    subscription: string;
  }> => {
    try {
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        return {
          canUpload: false,
          currentCount: 0,
          dailyLimit: 3,
          remainingUploads: 0,
          subscription: 'غير مسجل'
        };
      }
      
      const userId = user.data.user.id;
      
      // الحصول على معلومات الباقة الحالية للمستخدم
      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_plan, daily_image_limit')
        .eq('id', userId)
        .single();
      
      const subscription = profileData?.subscription_plan || 'standard';
      const dailyLimit = profileData?.daily_image_limit || 3;
      
      // الحصول على عدد التحميلات الحالية
      const { data: countData, error } = await supabase.rpc(
        'get_user_daily_upload_count',
        { user_id_param: userId }
      );
      
      if (error) {
        console.error("خطأ في الحصول على عدد التحميلات اليومية:", error);
        throw new Error(error.message);
      }
      
      const currentCount = countData || 0;
      const remainingUploads = Math.max(0, dailyLimit - currentCount);
      
      // تحديث معلومات الحدود
      setUploadLimitInfo({
        currentCount,
        dailyLimit,
        remainingUploads,
        subscription
      });
      
      return {
        canUpload: currentCount < dailyLimit,
        currentCount,
        dailyLimit,
        remainingUploads,
        subscription
      };
    } catch (error) {
      console.error("خطأ في التحقق من حدود التحميل:", error);
      return {
        canUpload: false,
        currentCount: 0,
        dailyLimit: 3,
        remainingUploads: 0,
        subscription: 'خطأ'
      };
    }
  }, []);
  
  // تحديث عداد التحميل بعد كل عملية تحميل ناجحة
  const incrementUploadCount = useCallback(async () => {
    try {
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        return false;
      }
      
      const userId = user.data.user.id;
      
      // استدعاء وظيفة زيادة العداد
      const { data, error } = await supabase.rpc(
        'increment_user_upload_count',
        { user_id_param: userId }
      );
      
      if (error) {
        console.error("خطأ في زيادة عداد التحميل:", error);
        return false;
      }
      
      // تحديث حالة الحدود المحلية
      setUploadLimitInfo(prev => ({
        ...prev,
        currentCount: data,
        remainingUploads: Math.max(0, prev.dailyLimit - data)
      }));
      
      return true;
    } catch (error) {
      console.error("خطأ في زيادة عداد التحميل:", error);
      return false;
    }
  }, []);

  // وظيفة لحساب التأخير المثالي بين معالجات الصور
  const calculateIdealDelay = useCallback(() => {
    // الحصول على إحصائيات مفاتيح API
    const apiStats = getApiKeyStats();
    const apiKeysRatio = apiStats.active / apiStats.total;
    
    // حساب نسبة نجاح المعالجة
    const { successful, failed, totalAttempted } = processingStats.current;
    const successRatio = totalAttempted > 0 ? successful / totalAttempted : 1;
    
    // التأخير الأساسي - تم زيادته للتأكد من عدم تجاوز حدود API
    let baseDelay = 3000; // 3 ثوانٍ كحد أدنى
    
    // زيادة التأخير إذا كان هناك الكثير من المفاتيح المحظورة
    if (apiKeysRatio < 0.5) {
      baseDelay = 7000; // 7 ثوانٍ إذا كان أكثر من نصف المفاتيح محظورة
    } else if (apiKeysRatio < 0.75) {
      baseDelay = 5000; // 5 ثوانٍ إذا كان أكثر من ربع المفاتيح محظورة
    }
    
    // زيادة التأخير إذا كانت نسبة النجاح منخفضة
    if (totalAttempted > 5 && successRatio < 0.6) {
      baseDelay += 3000; // إضافة 3 ثوانٍ إذا كانت نسبة النجاح أقل من 60%
    }
    
    // زيادة التأخير بشكل عشوائي قليلاً لتجنب أنماط طلب متوقعة
    const randomVariation = Math.floor(Math.random() * 2000); // 0-2000 مللي ثانية
    
    return baseDelay + randomVariation;
  }, []);

  // وظيفة لرفع الصورة إلى Supabase Storage
  const uploadToStorage = useCallback(async (
    file: File, 
    userId: string, 
    imageId: string
  ): Promise<string | null> => {
    try {
      if (!file || !userId) {
        console.error("ملف غير صالح أو معرف مستخدم غير موجود");
        return null;
      }

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${imageId}_${timestamp}.${fileExt}`;
      
      console.log(`جاري رفع الصورة إلى التخزين: ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from('receipt_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("خطأ في رفع الصورة إلى التخزين:", error);
        return null;
      }
      
      console.log("تم رفع الصورة بنجاح:", data.path);
      return data.path;
    } catch (error) {
      console.error("خطأ غير متوقع أثناء رفع الصورة:", error);
      return null;
    }
  }, []);

  // وظيفة معالجة صورة واحدة (OCR أو Gemini)
  const processImage = useCallback(async (image: ImageData) => {
    console.log(`بدء معالجة الصورة: ${image.id}`);
    
    try {
      // زيادة عداد المحاولات الكلية
      processingStats.current.totalAttempted++;
      
      // تحديث حالة الصورة إلى "جاري المعالجة"
      updateImage(image.id, {
        status: "processing",
        extractedText: "جاري استخراج النص من الصورة...",
        processingAttempts: (image.processingAttempts || 0) + 1
      });
      
      // تسجيل محاولة المعالجة
      const currentAttempt = retryAttemptsMap.current.get(image.id) || 0;
      retryAttemptsMap.current.set(image.id, currentAttempt + 1);
      
      // التحقق من عدد المحاولات - إذا تجاوز الحد، أعد تعيين مفاتيح API
      if (currentAttempt >= 3 && currentAttempt % 3 === 0) {
        console.log(`عدد كبير من المحاولات للصورة ${image.id}, إعادة تعيين مفاتيح API...`);
        resetApiKeys();
        // تأخير قصير بعد إعادة التعيين
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // التحقق من وجود الملف
      if (!image.file) {
        throw new Error("ملف الصورة غير متاح");
      }
      
      // رفع الصورة إلى Supabase Storage إذا كان المستخدم مسجل الدخول
      const user = supabase.auth.getUser();
      let storagePath = null;
      
      if ((await user).data.user) {
        storagePath = await uploadToStorage(
          image.file, 
          (await user).data.user.id, 
          image.id
        );
        
        if (storagePath) {
          console.log(`تم رفع الصورة إلى التخزين: ${storagePath}`);
          // تحديث مسار التخزين في الصورة
          updateImage(image.id, {
            storage_path: storagePath
          });
        }
      }
      
      // معالجة الصورة بناءً على الطريقة المختارة
      let processedImage: ImageData;
      
      // التحقق من حجم الملف وطباعة معلومات تشخيصية
      const fileSizeMB = image.file.size / (1024 * 1024);
      console.log(`حجم ملف الصورة: ${fileSizeMB.toFixed(2)} ميجابايت`);
      
      // استخدام Gemini إذا كان مفعلاً
      if (geminiEnabled) {
        console.log(`معالجة الصورة ${image.id} باستخدام Gemini (المحاولة رقم ${currentAttempt + 1})`);
        
        // إذا كان حجم الصورة كبيرًا جدًا، حاول ضغطها أكثر قبل الإرسال إلى Gemini
        if (fileSizeMB > 3) {
          try {
            console.log(`ضغط الصورة ${image.id} قبل المعالجة (الحجم الأصلي: ${fileSizeMB.toFixed(2)} MB)`);
            const compressedFile = await compressImage(image.file, { 
              maxSizeMB: 1, 
              maxWidthOrHeight: 1200,
              useWebWorker: true,
              initialQuality: 0.7
            });
            const newSizeMB = compressedFile.size / (1024 * 1024);
            console.log(`تم ضغط الصورة إلى ${newSizeMB.toFixed(2)} MB`);
            
            // تحديث الملف المضغوط
            image = { ...image, file: compressedFile };
          } catch (compressionError) {
            console.error(`خطأ في ضغط الصورة ${image.id}:`, compressionError);
            // استمر بالملف الأصلي إذا فشل الضغط
          }
        }
        
        // محاولة معالجة الصورة مع إعادة التشغيل التلقائي في حالة الفشل
        const maxGeminiAttempts = 2;
        let geminiAttempt = 0;
        let lastError = null;
        
        while (geminiAttempt < maxGeminiAttempts) {
          try {
            geminiAttempt++;
            processedImage = await processWithGemini(image.file, image);
            lastError = null;
            break; // الخروج من الحلقة إذا نجحت المعالجة
          } catch (geminiError) {
            console.error(`فشلت محاولة Gemini ${geminiAttempt}/${maxGeminiAttempts}:`, geminiError);
            lastError = geminiError;
            
            if (geminiAttempt < maxGeminiAttempts) {
              // تأخير قبل المحاولة التالية
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // تحديث حالة الصورة لتعكس إعادة المحاولة
              updateImage(image.id, {
                status: "processing",
                extractedText: `جاري إعادة محاولة المعالجة (${geminiAttempt + 1}/${maxGeminiAttempts})...`
              });
            }
          }
        }
        
        // إذا فشلت جميع محاولات Gemini، جرب OCR كبديل
        if (lastError !== null) {
          console.log(`فشلت جميع محاولات Gemini، جاري تجربة OCR كبديل للصورة ${image.id}`);
          updateImage(image.id, {
            status: "processing",
            extractedText: "فشلت معالجة Gemini. جاري تجربة OCR كبديل..."
          });
          
          try {
            processedImage = await processWithOcr(image.file, image);
          } catch (ocrError) {
            console.error(`فشلت كل من Gemini و OCR للصورة ${image.id}:`, ocrError);
            throw new Error(`فشلت جميع طرق المعالجة: ${lastError.message}`);
          }
        }
      } else {
        console.log(`معالجة الصورة ${image.id} باستخدام OCR`);
        processedImage = await processWithOcr(image.file, image);
      }
      
      // إضافة مسار التخزين إلى البيانات المعالجة
      if (storagePath) {
        processedImage.storage_path = storagePath;
      }
      
      // التحقق من نجاح المعالجة من خلال وجود البيانات المستخرجة
      const hasExtractedData = processedImage.code || 
        processedImage.senderName || 
        processedImage.phoneNumber || 
        processedImage.province || 
        processedImage.price;
      
      if (hasExtractedData) {
        processingStats.current.successful++;
      } else {
        // لم يتم استخراج بيانات، لكن لم يحدث خطأ تقني
        console.log(`لم يتم استخراج بيانات من الصورة ${image.id}`);
        // لا نعتبرها فاشلة تقنياً، لكن نجعل المستخدم يعرف أنه لم يتم استخراج بيانات
      }
      
      console.log("البيانات المستخرجة من الصورة:", {
        code: processedImage.code,
        senderName: processedImage.senderName,
        phoneNumber: processedImage.phoneNumber,
        province: processedImage.province,
        price: processedImage.price,
        companyName: processedImage.companyName
      });
      
      // تحديث الواجهة بالبيانات المستخرجة قبل الحفظ في قاعدة البيانات
      updateImage(image.id, {
        status: hasExtractedData ? "completed" : "pending",
        code: processedImage.code,
        senderName: processedImage.senderName,
        phoneNumber: processedImage.phoneNumber,
        province: processedImage.province,
        price: processedImage.price,
        companyName: processedImage.companyName,
        extractedText: processedImage.extractedText,
        confidence: processedImage.confidence,
        storage_path: storagePath // تحديث مسار التخزين
      });
      
      // إضافة تأخير قبل حفظ البيانات للسماح بعرض البيانات في الواجهة
      const delayBeforeSave = calculateIdealDelay();
      console.log(`تأخير ${delayBeforeSave}ms قبل حفظ الصورة ${image.id}...`);
      await new Promise(resolve => setTimeout(resolve, delayBeforeSave));
      
      // حفظ البيانات المستخرجة والصورة المعالجة - فقط إذا كان هناك بيانات مستخرجة
      if (hasExtractedData) {
        try {
          await saveProcessedImage(processedImage);
          console.log(`تم حفظ الصورة ${image.id} في قاعدة البيانات بنجاح`);
        } catch (saveError) {
          console.error(`خطأ في حفظ الصورة ${image.id} في قاعدة البيانات:`, saveError);
          // لا نريد إفشال العملية بأكملها إذا فشل الحفظ فقط
        }
      } else {
        console.log(`تخطي حفظ الصورة ${image.id} لأنه لم يتم استخراج بيانات`);
      }
      
      // إضافة هاش الصورة إلى الكاش إذا كان متاحاً
      if (processedImage.imageHash) {
        processedHashes.current.add(processedImage.imageHash);
      }
      
      console.log(`تمت معالجة الصورة بنجاح: ${image.id}`);
      return processedImage;
    } catch (error) {
      console.error(`خطأ في معالجة الصورة ${image.id}:`, error);
      
      // زيادة عداد الفشل
      processingStats.current.failed++;
      
      // تحديث حالة الصورة إلى "خطأ" مع رسالة الخطأ
      updateImage(image.id, {
        status: "error",
        extractedText: `فشل في معالجة الصورة: ${error.message || "خطأ غير معروف"}`
      });
      
      // إعادة رمي الخطأ للتعامل معه في وظيفة القائمة
      throw error;
    }
  }, [
    geminiEnabled, 
    processWithGemini, 
    processWithOcr, 
    saveProcessedImage, 
    updateImage, 
    calculateIdealDelay, 
    resetApiKeys,
    uploadToStorage
  ]);

  // معالج تغيير الملفات - عند رفع الصور
  const handleFileChange = useCallback(async (files: File[]) => {
    if (!files.length) return;
    
    const batchId = uuidv4(); // إنشاء معرف مجموعة للملفات المرفوعة معاً
    console.log(`تم استلام ${files.length} ملفات، معرف المجموعة: ${batchId}`);
    
    // التحقق من حدود التحميل قبل المعالجة
    const { canUpload, remainingUploads, dailyLimit, subscription } = await checkUserUploadLimits();
    
    if (!canUpload) {
      toast({
        title: "تم الوصول للحد اليومي",
        description: `لقد وصلت إلى الحد اليومي لباقتك (${dailyLimit} صورة). يرجى الترقية أو الانتظار حتى الغد.`,
        variant: "destructive"
      });
      return;
    }
    
    // التحقق إذا كان عدد الصور أكبر من الحد المتبقي
    if (files.length > remainingUploads) {
      toast({
        title: "تجاوز الحد المتبقي",
        description: `يمكنك تحميل ${remainingUploads} صورة فقط من أصل ${files.length} صورة محددة. سيتم معالجة أول ${remainingUploads} صورة فقط.`,
        variant: "warning"
      });
    }

    // التحقق من التكرار قبل المعالجة
    removeDuplicates();
    
    // تأخير قبل بدء المعالجة
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // تنظيف قائمة المعالجة قبل إضافة صور جديدة إذا كان هناك الكثير من الصور
    if (files.length > 10) {
      clearQueue();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // التحقق من إحصائيات المفاتيح وإعادة تعيينها إذا لزم الأمر
    const apiStats = getApiKeyStats();
    console.log("إحصائيات مفاتيح API:", apiStats);
    
    // إذا كان هناك الكثير من المفاتيح المحظورة، قم بإعادة تعيينها
    if (apiStats.rateLimited > apiStats.active && processingStats.current.lastResetTime < Date.now() - 300000) {
      resetAllApiKeys();
      processingStats.current.lastResetTime = Date.now();
      toast({
        title: "إعادة تعيين",
        description: "تم إعادة تعيين مفاتيح API المحظورة",
      });
    }
    
    // إضافة تأخير بين إضافة كل صورة لضمان ترتيبها الصحيح
    const addDelay = 300; // زيادة التأخير بين الصور
    
    // تحديد عدد الصور المراد معالجتها (لا يتجاوز الحد المتبقي أو الحد الأقصى)
    const maxBatchSize = Math.min(20, remainingUploads); // لا نريد أكثر من 20 صورة أو تجاوز الحد المتبقي
    const filesToProcess = files.slice(0, maxBatchSize);
    
    if (files.length > maxBatchSize) {
      toast({
        title: "تنبيه",
        description: `سيتم معالجة أول ${maxBatchSize} صورة فقط. يرجى رفع الباقي في دفعة لاحقة.`,
        variant: "default"
      });
    }
    
    // تفكيك العملية إلى مراحل لتحسين تجربة المستخدم
    
    // المرحلة 1: إضافة جميع الصور إلى حالة التطبيق (مع ضغط وتهيئة)
    console.log("المرحلة 1: إضافة الصور إلى حالة التطبيق");
    const addedImageIds: string[] = [];
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const fileNumber = i + 1;
      
      // تأخير أكبر بين إضافة كل صورة
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, addDelay));
      }
      
      try {
        // ضغط الصورة أولاً
        const compressedFile = await compressImage(file);
        console.log(`تم ضغط الصورة ${fileNumber}/${filesToProcess.length}، الحجم الجديد: ${compressedFile.size}`);
        
        // إنشاء عنوان URL مؤقت للعرض
        const previewUrl = URL.createObjectURL(compressedFile);
        
        // إنشاء كائن الصورة الجديد
        const newImage: ImageData = {
          id: uuidv4(),
          file: compressedFile,
          previewUrl,
          extractedText: "في انتظار المعالجة...",
          date: new Date(),
          status: "pending",
          batch_id: batchId,
          number: fileNumber,
          processingAttempts: 0
        };
        
        // التحقق من التكرار
        if (isDuplicateImage(newImage, images)) {
          console.log(`الصورة ${fileNumber} مكررة، تخطيها`);
          URL.revokeObjectURL(previewUrl);
          continue;
        }
        
        // إضافة الصورة إلى الحالة
        addImage(newImage);
        addedImageIds.push(newImage.id);
        
        // زيادة عداد التحميل
        await incrementUploadCount();
        
        // تحديث التقدم
        setProcessingProgress((fileNumber / filesToProcess.length) * 50); // الوصول إلى 50% فقط للمرحلة 1
      } catch (error) {
        console.error(`خطأ في تهيئة الملف ${fileNumber}:`, error);
      }
    }
    
    // تأخير بين المرحلتين
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // المرحلة 2: إضافة الصور إلى قائمة المعالجة بالتسلسل
    console.log("المرحلة 2: إضافة الصور إلى قائمة المعالجة");
    
    // إيقاف المعالجة الحالية قبل إضافة صور جديدة
    if (isProcessing) {
      pauseProcessing();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    for (let i = 0; i < addedImageIds.length; i++) {
      const imageId = addedImageIds[i];
      const imageToProcess = images.find(img => img.id === imageId);
      
      if (!imageToProcess) {
        console.error(`لم يتم العثور على الصورة ${imageId}`);
        continue;
      }
      
      // تأخير كبير بين إضافة كل صورة إلى قائمة المعالجة
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // إنشاء وظيفة معالجة الصورة
      const processThisImage = async () => {
        try {
          await processImage(imageToProcess);
        } catch (error) {
          console.error(`خطأ في معالجة الصورة ${imageId}:`, error);
        }
      };
      
      // إضافة الصورة إلى قائمة المعالجة
      addToQueue(imageId, imageToProcess, processThisImage);
      console.log(`تمت إضافة الصورة ${imageId} إلى قائمة المعالجة (${i + 1}/${addedImageIds.length})`);
      
      // تحديث التقدم
      setProcessingProgress(50 + (i + 1) / addedImageIds.length * 50); // من 50% إلى 100%
    }
    
    // إذا كان هناك صور تمت إضافتها، أظهر إشعارًا
    if (addedImageIds.length > 0) {
      toast({
        title: "تم إضافة الصور",
        description: `تمت إضافة ${addedImageIds.length} صور إلى قائمة المعالجة`,
      });
      
      // تأكد من بدء المعالجة
      setTimeout(() => {
        manuallyTriggerProcessingQueue();
      }, 2000);
    }
    
    setProcessingProgress(100);
    
    // إعادة التقدم إلى 0 بعد فترة
    setTimeout(() => {
      setProcessingProgress(0);
    }, 2000);
    
    // التحقق من حدود التحميل مرة أخرى لتحديث المعلومات
    await checkUserUploadLimits();
  }, [
    addImage, 
    images, 
    isDuplicateImage, 
    removeDuplicates, 
    setProcessingProgress, 
    addToQueue, 
    isProcessing, 
    pauseProcessing, 
    clearQueue, 
    manuallyTriggerProcessingQueue, 
    processImage,
    toast,
    checkUserUploadLimits,
    incrementUploadCount
  ]);

  // التحقق من حدود التحميل عند تحميل المكون
  useEffect(() => {
    checkUserUploadLimits();
    
    // التحقق كل 5 دقائق لتحديث المعلومات
    const intervalId = setInterval(() => {
      checkUserUploadLimits();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [checkUserUploadLimits]);

  return { 
    isProcessing, 
    handleFileChange,
    activeUploads,
    queueLength,
    useGemini: geminiEnabled,
    pauseProcessing,
    clearQueue,
    manuallyTriggerProcessingQueue,
    getProcessingState,
    clearProcessedHashesCache,
    uploadLimitInfo // إضافة معلومات الحدود
  };
};
