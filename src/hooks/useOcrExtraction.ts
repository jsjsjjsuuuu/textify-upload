
import { createWorker, Worker, RecognizeResult } from 'tesseract.js';
import { useState, useCallback } from 'react';

export interface OcrOptions {
  language?: string;
  rectangle?: { left: number; top: number; width: number; height: number };
  imageScale?: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
  words?: { text: string; confidence: number; bbox: any }[];
  hocr?: string;
}

export const useOcrExtraction = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [worker, setWorker] = useState<Worker | null>(null);

  // إنشاء worker للتعرف على النص
  const initWorker = useCallback(async (language: string = 'eng+ara') => {
    if (worker) return worker;
    
    const newWorker = await createWorker({
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(m.progress);
        }
      },
    });
    
    await newWorker.loadLanguage(language);
    await newWorker.initialize(language);
    
    setWorker(newWorker);
    return newWorker;
  }, [worker]);

  // استخراج النص من الصورة
  const extractTextFromImage = useCallback(async (
    image: File | string,
    options: OcrOptions = { language: 'eng+ara' }
  ): Promise<OcrResult> => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // تهيئة العامل
      const currentWorker = await initWorker(options.language);
      
      // خيارات التعرف
      const recognizeOptions: any = {};
      
      // إذا تم تحديد مستطيل للاقتصاص
      if (options.rectangle) {
        recognizeOptions.rectangle = options.rectangle;
      }
      
      // التعرف على النص
      let result: RecognizeResult;
      
      if (typeof image === 'string') {
        // إذا كان الإدخال هو URL للصورة
        result = await currentWorker.recognize(image, recognizeOptions);
      } else {
        // إذا كان الإدخال ملف صورة
        result = await currentWorker.recognize(image, recognizeOptions);
      }
      
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words,
        hocr: result.data.hocr
      };
    } catch (error) {
      console.error('فشل في استخراج النص من الصورة:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [initWorker]);

  // تنظيف الموارد
  const terminateWorker = useCallback(async () => {
    if (worker) {
      await worker.terminate();
      setWorker(null);
    }
  }, [worker]);

  return {
    extractTextFromImage,
    terminateWorker,
    isLoading,
    progress
  };
};
