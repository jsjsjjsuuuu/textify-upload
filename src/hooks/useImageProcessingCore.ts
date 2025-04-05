
import { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ImageData } from '@/types/ImageData';
import { useDataExtraction } from '@/hooks/useDataExtraction';
import { useStorage } from '@/hooks/useStorage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGeminiProcessing } from '@/hooks/useGeminiProcessing';
import { toast } from 'sonner';

// حد الصور في قائمة الانتظار
const MAX_QUEUE_SIZE = 10;
// حد عمليات المعالجة المتزامنة
const MAX_CONCURRENT_UPLOADS = 2;

// للتتبع العام
let activeUploadsCount = 0;
let queuedUploadsCount = 0;
let isPaused = false;

// حالة حلقة المعالجة
type ProcessingQueueState = {
  queue: string[];
  processing: string[];
  active: boolean;
};

// إجراءات حلقة المعالجة
type ProcessingQueueAction = 
  | { type: 'ADD_TO_QUEUE', id: string }
  | { type: 'START_PROCESSING', id: string }
  | { type: 'FINISH_PROCESSING', id: string }
  | { type: 'ACTIVATE' }
  | { type: 'DEACTIVATE' }
  | { type: 'CLEAR' };

// مخفض حلقة المعالجة
function processingQueueReducer(state: ProcessingQueueState, action: ProcessingQueueAction): ProcessingQueueState {
  switch (action.type) {
    case 'ADD_TO_QUEUE':
      if (state.queue.includes(action.id) || state.processing.includes(action.id)) {
        return state;
      }
      return { ...state, queue: [...state.queue, action.id] };
      
    case 'START_PROCESSING':
      return {
        ...state,
        queue: state.queue.filter(id => id !== action.id),
        processing: [...state.processing, action.id]
      };
      
    case 'FINISH_PROCESSING':
      return {
        ...state,
        processing: state.processing.filter(id => id !== action.id)
      };
      
    case 'ACTIVATE':
      return { ...state, active: true };
      
    case 'DEACTIVATE':
      return { ...state, active: false };
      
    case 'CLEAR':
      return { ...state, queue: [] };
      
    default:
      return state;
  }
}

// Hook المعالجة الرئيسي
export const useImageProcessingCore = () => {
  const { user } = useAuth();
  const { uploadImageToStorage } = useStorage();
  const { processImageWithGemini } = useGeminiProcessing();
  
  // حالة الصور
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);
  
  // حالة المعالجة
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // حلقة المعالجة
  const [processingState, processingDispatch] = useReducer(processingQueueReducer, {
    queue: [],
    processing: [],
    active: false
  });
  
  // مرجع للصور المعالجة
  const processedImagesRef = useRef(new Set<string>());
  
  // كاش مؤقت للصور
  const [imageCache, setImageCache] = useState(new Map<string, { file: File, data: string }>());
  
  // إحصائيات محددة للإشارات المرجعية
  const [bookmarkletStats, setBookmarkletStats] = useState({
    pending: 0,
    processed: 0
  });
  
  // تتبع حالة الإيقاف المؤقت
  const pausedRef = useRef(isPaused);
  
  // حالة التخزين - مطلوبة للتحديث قبل استخدامها في الحلقة الرئيسية
  const [storageState, setStorageState] = useState({
    isUploading: false,
    progress: 0
  });
  
  // تحديث حالة الصور الخارجية
  useEffect(() => {
    activeUploadsCount = processingState.processing.length;
    queuedUploadsCount = processingState.queue.length;
    isPaused = !processingState.active;
  }, [processingState]);
  
  // أرقام التسلسل للصور
  const [lastNumber, setLastNumber] = useState(0);
  
  // تحميل تسلسل الأرقام من localStorage
  useEffect(() => {
    const lastNumberString = localStorage.getItem('lastImageNumber');
    if (lastNumberString) {
      setLastNumber(parseInt(lastNumberString, 10));
    }
  }, []);
  
  // الحصول على الرقم التالي
  const getNextNumber = useCallback(() => {
    const nextNumber = lastNumber + 1;
    setLastNumber(nextNumber);
    localStorage.setItem('lastImageNumber', nextNumber.toString());
    return nextNumber;
  }, [lastNumber]);
  
  // تحميل الصور المرتبطة بالمستخدم من قاعدة البيانات
  const loadUserImages = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('receipt_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // تحويل البيانات من قاعدة البيانات إلى النوع ImageData
        const loadedImages: ImageData[] = data.map(item => ({
          id: item.id,
          file: null,
          previewUrl: item.image_url || null,
          date: new Date(item.created_at),
          extractedText: item.extracted_text || '',
          confidence: item.confidence || 0,
          companyName: item.company_name || '',
          code: item.code || '',
          senderName: item.sender_name || '',
          phoneNumber: item.phone_number || '',
          province: item.province || '',
          price: item.price || '',
          status: item.status || 'completed',
          error: item.error || null,
          apiKeyError: item.api_key_error || false,
          storage_path: item.storage_path || null,
          userId: item.user_id,
          number: item.number || 0,
          sessionImage: false,
          submitted: item.submitted || false
        }));
        
        // تحديث أعلى رقم
        const maxNumber = Math.max(0, ...loadedImages.map(img => img.number || 0));
        if (maxNumber > lastNumber) {
          setLastNumber(maxNumber);
          localStorage.setItem('lastImageNumber', maxNumber.toString());
        }
        
        setImages(loadedImages);
      }
    } catch (error) {
      console.error('خطأ في تحميل الصور من قاعدة البيانات:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات الصور');
    }
  }, [user, lastNumber]);
  
  // تحميل الصور عند تحميل المكون وعندما يتغير المستخدم
  useEffect(() => {
    if (user) {
      loadUserImages();
    }
  }, [user, loadUserImages]);
  
  // التعامل مع إضافة ملف صورة
  const handleFileChange = useCallback((files: FileList | File[]) => {
    // تحويل FileList إلى مصفوفة
    const fileArray = Array.from(files);
    
    // إنشاء كائنات ImageData للصور الجديدة
    const newImages: ImageData[] = [];
    
    fileArray.forEach(file => {
      // إنشاء معرف فريد للصورة
      const id = uuidv4();
      
      // إنشاء عنوان URL مؤقت للمعاينة
      const previewUrl = URL.createObjectURL(file);
      
      // إضافة الصورة إلى الكاش المؤقت
      setImageCache(prev => {
        const newCache = new Map(prev);
        newCache.set(id, { file, data: previewUrl });
        return newCache;
      });
      
      // إنشاء كائن ImageData للصورة
      const newImage: ImageData = {
        id,
        file,
        previewUrl,
        date: new Date(),
        extractedText: '',
        confidence: 0,
        companyName: '',
        code: '',
        senderName: '',
        phoneNumber: '',
        province: '',
        price: '',
        status: 'pending',
        error: null,
        apiKeyError: false,
        storage_path: null,
        userId: user?.id || null,
        number: getNextNumber(),
        sessionImage: true,
        submitted: false
      };
      
      newImages.push(newImage);
      
      // إضافة الصورة لحلقة المعالجة
      processingDispatch({ type: 'ADD_TO_QUEUE', id });
    });
    
    // إضافة الصور الجديدة إلى حالة الصور والجلسة
    setImages(prevImages => [...newImages, ...prevImages]);
    setSessionImages(prevImages => [...newImages, ...prevImages]);
    
    // تفعيل حلقة المعالجة إذا لم تكن نشطة
    if (!processingState.active) {
      processingDispatch({ type: 'ACTIVATE' });
    }
    
  }, [user, getNextNumber, processingState.active]);
  
  // التعامل مع تغيير النص
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    setImages(prevImages => prevImages.map(image => 
      image.id === id ? { ...image, [field]: value } : image
    ));
    
    setSessionImages(prevImages => prevImages.map(image => 
      image.id === id ? { ...image, [field]: value } : image
    ));
  }, []);
  
  // التعامل مع حذف الصورة
  const handleDelete = useCallback(async (id: string) => {
    try {
      // البحث عن الصورة في المصفوفة
      const image = images.find(img => img.id === id);
      if (!image) {
        console.error(`الصورة غير موجودة بالمعرف: ${id}`);
        return false;
      }
      
      // إذا كانت الصورة مخزنة في التخزين، قم بحذفها
      if (image.storage_path) {
        // حذف الصورة من تخزين Supabase
        const { error } = await supabase.storage
          .from('receipt_images')
          .remove([image.storage_path]);
          
        if (error) {
          console.error('خطأ في حذف الصورة من التخزين:', error);
        }
      }
      
      // إذا كانت الصورة مخزنة في قاعدة البيانات، قم بحذفها
      if (image.userId) {
        const { error } = await supabase
          .from('receipt_images')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error('خطأ في حذف الصورة من قاعدة البيانات:', error);
          return false;
        }
      }
      
      // إزالة الصورة من حلقة المعالجة إذا كانت موجودة فيها
      if (processingState.queue.includes(id)) {
        processingDispatch({ type: 'FINISH_PROCESSING', id });
      }
      if (processingState.processing.includes(id)) {
        processingDispatch({ type: 'FINISH_PROCESSING', id });
      }
      
      // إزالة الصورة من الكاش المؤقت
      setImageCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(id);
        return newCache;
      });
      
      // إزالة الصورة من مصفوفة الصور والجلسة
      setImages(prevImages => prevImages.filter(image => image.id !== id));
      setSessionImages(prevImages => prevImages.filter(image => image.id !== id));
      
      // تحرير أي عناوين URL مؤقتة
      if (image.previewUrl && image.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(image.previewUrl);
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في حذف الصورة:', error);
      return false;
    }
  }, [images, processingState.queue, processingState.processing]);
  
  // حفظ الصورة المعالجة
  const saveProcessedImage = useCallback(async (image: ImageData) => {
    if (!user) {
      throw new Error('يجب تسجيل الدخول لحفظ الصورة');
    }
    
    try {
      // تحديث حالة المعالجة
      const updatedImage = {
        ...image,
        status: 'completed',
        userId: user.id
      };
      
      // إذا كانت الصورة مخزنة في قاعدة البيانات، قم بتحديثها
      const { error } = await supabase
        .from('receipt_images')
        .upsert({
          id: image.id,
          user_id: user.id,
          image_url: image.previewUrl,
          extracted_text: image.extractedText,
          confidence: image.confidence,
          company_name: image.companyName,
          code: image.code,
          sender_name: image.senderName,
          phone_number: image.phoneNumber,
          province: image.province,
          price: image.price,
          status: 'completed',
          error: image.error,
          api_key_error: image.apiKeyError,
          storage_path: image.storage_path,
          number: image.number,
          submitted: image.submitted,
          created_at: image.date.toISOString()
        });
        
      if (error) {
        throw error;
      }
      
      // تحديث الصورة في مصفوفة الصور والجلسة
      setImages(prevImages => 
        prevImages.map(img => img.id === image.id ? updatedImage : img)
      );
      
      setSessionImages(prevImages => 
        prevImages.map(img => img.id === image.id ? updatedImage : img)
      );
      
      return updatedImage;
    } catch (error) {
      console.error('خطأ في حفظ الصورة المعالجة:', error);
      throw error;
    }
  }, [user]);
  
  // حلقة معالجة الصور الرئيسية
  useEffect(() => {
    // إذا كانت الحلقة غير نشطة، قم بإنهاء التنفيذ
    if (!processingState.active || pausedRef.current) {
      return;
    }
    
    // التحقق من وجود صور في قائمة الانتظار
    if (processingState.queue.length === 0 || processingState.processing.length >= MAX_CONCURRENT_UPLOADS) {
      return;
    }
    
    // الحصول على معرف الصورة التالية من القائمة
    const nextImageId = processingState.queue[0];
    
    // التأكد من وجود الصورة ومن أنها في حالة انتظار
    const imageToProcess = images.find(img => img.id === nextImageId && img.status === 'pending');
    if (!imageToProcess) {
      // إزالة المعرف من القائمة إذا لم يتم العثور على الصورة
      processingDispatch({ type: 'FINISH_PROCESSING', id: nextImageId });
      return;
    }
    
    // بدء معالجة الصورة
    processingDispatch({ type: 'START_PROCESSING', id: nextImageId });
    
    // تحديث حالة الصورة إلى "جاري المعالجة"
    setImages(prevImages => 
      prevImages.map(img => img.id === nextImageId ? { ...img, status: 'processing' } : img)
    );
    setSessionImages(prevImages => 
      prevImages.map(img => img.id === nextImageId ? { ...img, status: 'processing' } : img)
    );
    
    // الحصول على بيانات الصورة من الكاش المؤقت
    const cachedData = imageCache.get(nextImageId);
    if (!cachedData || !cachedData.file) {
      console.error(`لم يتم العثور على بيانات الصورة في الكاش المؤقت للمعرف: ${nextImageId}`);
      processingDispatch({ type: 'FINISH_PROCESSING', id: nextImageId });
      return;
    }
    
    // وظيفة المعالجة الفعلية
    const processImage = async () => {
      try {
        // تحديث الحالة
        setIsProcessing(true);
        
        // رفع الصورة إلى التخزين
        const { path: storagePath, url: storageUrl } = await uploadImageToStorage(
          cachedData.file,
          `receipt_${nextImageId}`,
          (progress) => {
            setStorageState({ isUploading: true, progress });
          }
        );
        
        // تحديث حالة التخزين
        setStorageState({ isUploading: false, progress: 0 });
        
        // تحديث عنوان URL للمعاينة والمسار في التخزين
        setImages(prevImages => 
          prevImages.map(img => img.id === nextImageId ? 
            { ...img, previewUrl: storageUrl, storage_path: storagePath } : img)
        );
        setSessionImages(prevImages => 
          prevImages.map(img => img.id === nextImageId ? 
            { ...img, previewUrl: storageUrl, storage_path: storagePath } : img)
        );
        
        // معالجة الصورة باستخدام Gemini
        const result = await processImageWithGemini(cachedData.file);
        
        if (result.success && result.data) {
          // استخراج البيانات من النتيجة
          const { extractedText, parsedData, confidence } = result.data;
          
          // تحديث الصورة بالبيانات المستخرجة
          setImages(prevImages => 
            prevImages.map(img => img.id === nextImageId ? { 
              ...img, 
              extractedText: extractedText || '',
              confidence: confidence || 0,
              companyName: parsedData?.companyName || '',
              code: parsedData?.code || '',
              senderName: parsedData?.senderName || '',
              phoneNumber: parsedData?.phoneNumber || '',
              province: parsedData?.province || '',
              price: parsedData?.price || '',
              status: 'completed',
              error: null,
              apiKeyError: false
            } : img)
          );
          setSessionImages(prevImages => 
            prevImages.map(img => img.id === nextImageId ? { 
              ...img, 
              extractedText: extractedText || '',
              confidence: confidence || 0,
              companyName: parsedData?.companyName || '',
              code: parsedData?.code || '',
              senderName: parsedData?.senderName || '',
              phoneNumber: parsedData?.phoneNumber || '',
              province: parsedData?.province || '',
              price: parsedData?.price || '',
              status: 'completed',
              error: null,
              apiKeyError: false
            } : img)
          );
          
          // إضافة الصورة المعالجة إلى قاعدة البيانات
          if (user) {
            const updatedImage = images.find(img => img.id === nextImageId);
            if (updatedImage) {
              try {
                const { error } = await supabase
                  .from('receipt_images')
                  .upsert({
                    id: updatedImage.id,
                    user_id: user.id,
                    image_url: updatedImage.previewUrl,
                    extracted_text: extractedText || '',
                    confidence: confidence || 0,
                    company_name: parsedData?.companyName || '',
                    code: parsedData?.code || '',
                    sender_name: parsedData?.senderName || '',
                    phone_number: parsedData?.phoneNumber || '',
                    province: parsedData?.province || '',
                    price: parsedData?.price || '',
                    status: 'completed',
                    error: null,
                    api_key_error: false,
                    storage_path: storagePath,
                    number: updatedImage.number,
                    created_at: updatedImage.date.toISOString()
                  });
                  
                if (error) {
                  throw error;
                }
              } catch (dbError) {
                console.error('خطأ في حفظ البيانات المستخرجة في قاعدة البيانات:', dbError);
              }
            }
          }
        } else {
          // تحديث الصورة بحالة الخطأ
          setImages(prevImages => 
            prevImages.map(img => img.id === nextImageId ? { 
              ...img, 
              status: 'error',
              error: result.message || 'حدث خطأ أثناء معالجة الصورة',
              apiKeyError: result.apiKeyError || false
            } : img)
          );
          setSessionImages(prevImages => 
            prevImages.map(img => img.id === nextImageId ? { 
              ...img, 
              status: 'error',
              error: result.message || 'حدث خطأ أثناء معالجة الصورة',
              apiKeyError: result.apiKeyError || false
            } : img)
          );
          
          // إضافة الصورة الفاشلة إلى قاعدة البيانات
          if (user) {
            const failedImage = images.find(img => img.id === nextImageId);
            if (failedImage) {
              try {
                const { error } = await supabase
                  .from('receipt_images')
                  .upsert({
                    id: failedImage.id,
                    user_id: user.id,
                    image_url: failedImage.previewUrl,
                    status: 'error',
                    error: result.message || 'حدث خطأ أثناء معالجة الصورة',
                    api_key_error: result.apiKeyError || false,
                    storage_path: storagePath,
                    number: failedImage.number,
                    created_at: failedImage.date.toISOString()
                  });
                  
                if (error) {
                  throw error;
                }
              } catch (dbError) {
                console.error('خطأ في حفظ بيانات الصورة الفاشلة في قاعدة البيانات:', dbError);
              }
            }
          }
        }
        
        // إضافة المعرف إلى مجموعة الصور المعالجة
        processedImagesRef.current.add(nextImageId);
        
      } catch (error) {
        console.error(`خطأ في معالجة الصورة بالمعرف ${nextImageId}:`, error);
        
        // تحديث الصورة بحالة الخطأ
        setImages(prevImages => 
          prevImages.map(img => img.id === nextImageId ? { 
            ...img, 
            status: 'error',
            error: error.message || 'حدث خطأ غير متوقع أثناء معالجة الصورة'
          } : img)
        );
        setSessionImages(prevImages => 
          prevImages.map(img => img.id === nextImageId ? { 
            ...img, 
            status: 'error',
            error: error.message || 'حدث خطأ غير متوقع أثناء معالجة الصورة'
          } : img)
        );
      } finally {
        // إنهاء المعالجة
        processingDispatch({ type: 'FINISH_PROCESSING', id: nextImageId });
        setIsProcessing(false);
      }
    };
    
    // بدء المعالجة
    processImage();
    
  }, [
    processingState.active, 
    processingState.queue, 
    processingState.processing, 
    images, 
    imageCache, 
    uploadImageToStorage, 
    processImageWithGemini, 
    user
  ]);
  
  // مراقبة حالة المعالجة وتحديثها إذا تم معالجة جميع الصور
  useEffect(() => {
    if (processingState.queue.length === 0 && processingState.processing.length === 0) {
      // إذا لم تكن هناك صور في قائمة الانتظار أو قيد المعالجة، قم بتعطيل الحلقة
      processingDispatch({ type: 'DEACTIVATE' });
    }
  }, [processingState.queue, processingState.processing]);
  
  // تحديث الإحصائيات
  useEffect(() => {
    // تحديث إحصائيات الإشارات المرجعية
    const pendingBookmarklets = images.filter(img => img.status === 'pending' && img.previewUrl?.startsWith('http')).length;
    const processedBookmarklets = images.filter(img => img.status === 'completed' && img.previewUrl?.startsWith('http')).length;
    
    setBookmarkletStats({
      pending: pendingBookmarklets,
      processed: processedBookmarklets
    });
  }, [images]);
  
  // التعامل مع إرسال الصورة إلى API خارجي
  const handleSubmitToApi = useCallback(async (id: string) => {
    try {
      setIsSubmitting(true);
      
      // البحث عن الصورة في المصفوفة
      const image = images.find(img => img.id === id);
      if (!image) {
        throw new Error('الصورة غير موجودة');
      }
      
      // التحقق من اكتمال البيانات المطلوبة
      if (!image.code || !image.senderName || !image.phoneNumber || !image.province || !image.price) {
        throw new Error('يجب إكمال جميع البيانات المطلوبة');
      }
      
      // تنفيذ الإرسال إلى API (يمكن إضافة مزيد من المنطق هنا)
      console.log('إرسال البيانات إلى API:', image);
      
      // تحديث حالة الصورة
      const updatedImage = { ...image, submitted: true };
      setImages(prevImages => 
        prevImages.map(img => img.id === id ? updatedImage : img)
      );
      setSessionImages(prevImages => 
        prevImages.map(img => img.id === id ? updatedImage : img)
      );
      
      // تحديث قاعدة البيانات إذا كانت الصورة مخزنة فيها
      if (user && image.userId) {
        const { error } = await supabase
          .from('receipt_images')
          .update({ submitted: true })
          .eq('id', id);
          
        if (error) {
          throw error;
        }
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في إرسال البيانات إلى API:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [images, user]);
  
  // تنظيف آثار المكون
  useEffect(() => {
    return () => {
      // تحرير عناوين URL المؤقتة
      images.forEach(image => {
        if (image.previewUrl && image.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, [images]);
  
  // حفظ الصورة في قاعدة البيانات
  const saveImageToDatabase = useCallback(async (image: ImageData) => {
    if (!user) {
      throw new Error('يجب تسجيل الدخول لحفظ الصورة');
    }
    
    try {
      // إنشاء كائن للإدخال في قاعدة البيانات
      const dbImage = {
        id: image.id,
        user_id: user.id,
        image_url: image.previewUrl,
        extracted_text: image.extractedText,
        confidence: image.confidence,
        company_name: image.companyName,
        code: image.code,
        sender_name: image.senderName,
        phone_number: image.phoneNumber,
        province: image.province,
        price: image.price,
        status: image.status,
        error: image.error,
        api_key_error: image.apiKeyError,
        storage_path: image.storage_path,
        number: image.number,
        submitted: image.submitted,
        created_at: image.date.toISOString()
      };
      
      // إدخال البيانات في قاعدة البيانات
      const { data, error } = await supabase
        .from('receipt_images')
        .upsert(dbImage)
        .select();
        
      if (error) {
        throw error;
      }
      
      return data && data[0];
    } catch (error) {
      console.error('خطأ في حفظ الصورة في قاعدة البيانات:', error);
      throw error;
    }
  }, [user]);
  
  // وظيفة لمسح الصور من الجلسة الحالية
  const clearSessionImages = useCallback(() => {
    setSessionImages([]);
  }, []);
  
  // التحقق من وجود صورة مكررة
  const isDuplicateImage = useCallback((imageUrl: string) => {
    return images.some(img => img.previewUrl === imageUrl);
  }, [images]);
  
  // وظيفة لمسح كاش الصور المعالجة
  const clearProcessedImagesCache = useCallback(() => {
    processedImagesRef.current.clear();
  }, []);
  
  // وظيفة للتحقق من اكتمال معالجة الصور
  const isProcessingComplete = useCallback(() => {
    return processingState.queue.length === 0 && processingState.processing.length === 0;
  }, [processingState.queue, processingState.processing]);
  
  // وظيفة لمسح كاش الصور المؤقت
  const clearImageCache = useCallback(() => {
    // تحرير موارد عناوين URL المؤقتة
    imageCache.forEach((data, _) => {
      if (data.data.startsWith('blob:')) {
        URL.revokeObjectURL(data.data);
      }
    });
    
    setImageCache(new Map());
  }, [imageCache]);
  
  // وظيفة لتنفيذ التنظيف يدوياً
  const runCleanupNow = useCallback(async (userId: string) => {
    if (!userId) return;
    
    try {
      // الحصول على قائمة الصور مرتبة حسب التاريخ
      const { data, error } = await supabase
        .from('receipt_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (!data || data.length <= 100) {
        // إذا كان هناك 100 صورة أو أقل، لا داعي للتنظيف
        return;
      }
      
      // الصور التي يجب حذفها (بعد الـ 100 الأولى)
      const imagesToDelete = data.slice(100);
      
      // حذف الصور من التخزين أولاً
      for (const image of imagesToDelete) {
        if (image.storage_path) {
          await supabase.storage
            .from('receipt_images')
            .remove([image.storage_path]);
        }
      }
      
      // حذف الصور من قاعدة البيانات
      const imageIds = imagesToDelete.map(img => img.id);
      
      if (imageIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('receipt_images')
          .delete()
          .in('id', imageIds);
          
        if (deleteError) {
          throw deleteError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في تنفيذ التنظيف:', error);
      throw error;
    }
  }, []);
  
  // إعادة تشغيل المعالجة
  const retryProcessing = useCallback(() => {
    // إعادة تعيين حالة الإيقاف
    pausedRef.current = false;
    isPaused = false;
    
    // تفعيل حلقة المعالجة
    processingDispatch({ type: 'ACTIVATE' });
    
    // إعادة إضافة الصور التي في حالة خطأ إلى قائمة الانتظار
    const errorsToRetry = images.filter(img => img.status === 'error' || img.status === 'pending');
    
    errorsToRetry.forEach(img => {
      // تحديث حالة الصورة إلى "في انتظار المعالجة"
      setImages(prevImages => 
        prevImages.map(image => image.id === img.id ? { ...image, status: 'pending', error: null } : image)
      );
      setSessionImages(prevImages => 
        prevImages.map(image => image.id === img.id ? { ...image, status: 'pending', error: null } : image)
      );
      
      // إضافة الصورة إلى قائمة الانتظار
      processingDispatch({ type: 'ADD_TO_QUEUE', id: img.id });
    });
    
    return errorsToRetry.length > 0;
  }, [images]);
  
  // إيقاف المعالجة مؤقتًا
  const pauseProcessing = useCallback(() => {
    pausedRef.current = true;
    isPaused = true;
    processingDispatch({ type: 'DEACTIVATE' });
    return true;
  }, []);
  
  // مسح قائمة الانتظار
  const clearQueue = useCallback(() => {
    processingDispatch({ type: 'CLEAR' });
    return true;
  }, []);
  
  return {
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate: (date: Date) => date.toLocaleDateString(),
    clearSessionImages,
    loadUserImages,
    isDuplicateImage,
    clearProcessedImagesCache,
    isProcessingComplete,
    clearImageCache,
    runCleanupNow,
    saveProcessedImage,
    // إضافة وظائف التحكم في المعالجة
    retryProcessing,
    pauseProcessing,
    clearQueue,
    // إضافة معلومات الحالة
    activeUploads: processingState.processing.length,
    queueLength: processingState.queue.length,
    useGemini: true
  };
};
