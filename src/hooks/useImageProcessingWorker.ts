
import { useState, useEffect, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';

interface WorkerState {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
}

/**
 * هوك لإدارة معالجة الصور باستخدام عامل خلفي
 */
export const useImageProcessingWorker = () => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerState, setWorkerState] = useState<WorkerState>({
    isReady: false,
    isProcessing: false,
    error: null
  });
  
  // تهيئة عامل جديد عند بدء التشغيل
  useEffect(() => {
    // إنشاء العامل فقط في بيئة المتصفح (ليس في SSR)
    if (typeof Worker !== 'undefined') {
      try {
        const newWorker = new Worker(new URL('../workers/imageProcessor.ts', import.meta.url), {
          type: 'module'
        });
        
        // استماع لرسائل العامل
        newWorker.onmessage = (event) => {
          const { status, id, result, error } = event.data;
          
          if (status === 'ready') {
            setWorkerState(prev => ({ ...prev, isReady: true }));
          } else if (status === 'success') {
            // إرسال حدث نجاح المعالجة
            const processedEvent = new CustomEvent('image-processed', {
              detail: { imageId: id, result }
            });
            window.dispatchEvent(processedEvent);
            setWorkerState(prev => ({ ...prev, isProcessing: false }));
          } else if (status === 'error') {
            setWorkerState(prev => ({ 
              ...prev, 
              isProcessing: false, 
              error: error || 'خطأ غير معروف في معالجة الصورة' 
            }));
          }
        };
        
        // معالجة الأخطاء
        newWorker.onerror = (error) => {
          console.error('خطأ في عامل معالجة الصور:', error);
          setWorkerState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: 'فشل في بدء عامل معالجة الصور' 
          }));
        };
        
        setWorker(newWorker);
        
        // تنظيف عند إزالة المكون
        return () => {
          newWorker.terminate();
        };
      } catch (error) {
        console.error('فشل في إنشاء عامل معالجة الصور:', error);
        setWorkerState(prev => ({
          ...prev,
          error: 'فشل في إنشاء عامل معالجة الصور'
        }));
      }
    } else {
      setWorkerState(prev => ({
        ...prev,
        error: 'المتصفح لا يدعم Web Workers'
      }));
    }
  }, []);
  
  // وظيفة لمعالجة الصورة باستخدام العامل
  const processImage = useCallback((image: ImageData) => {
    if (!worker || !workerState.isReady) {
      console.error('عامل معالجة الصور غير متاح');
      return Promise.reject('عامل معالجة الصور غير متاح');
    }
    
    setWorkerState(prev => ({ ...prev, isProcessing: true }));
    
    return new Promise<Partial<ImageData>>((resolve, reject) => {
      // إنشاء مستمع لمرة واحدة للحصول على النتيجة
      const handleMessage = (event: CustomEvent) => {
        const { imageId, result } = event.detail;
        
        if (imageId === image.id) {
          window.removeEventListener('image-processed', handleMessage as EventListener);
          resolve(result);
        }
      };
      
      // الاستماع للنتيجة
      window.addEventListener('image-processed', handleMessage as EventListener);
      
      // إرسال الصورة للمعالجة
      worker.postMessage({
        action: 'process',
        id: image.id,
        imageData: image
      });
      
      // إلغاء الاستماع بعد 30 ثانية (مهلة)
      setTimeout(() => {
        window.removeEventListener('image-processed', handleMessage as EventListener);
        reject('انتهت مهلة معالجة الصورة');
      }, 30000);
    });
  }, [worker, workerState.isReady]);
  
  return {
    processImage,
    ...workerState
  };
};
