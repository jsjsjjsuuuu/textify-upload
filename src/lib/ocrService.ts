import { createWorker, WorkerOptions } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface OcrOptions {
  language?: string;
  quality?: 'fast' | 'balanced' | 'best';
  preprocess?: boolean;
}

export async function extractTextFromImage(file: File, options: OcrOptions = {}): Promise<OcrResult> {
  console.log("بدء عملية استخراج النص من الصورة:", file.name, "مع الخيارات:", options);
  try {
    // إعداد خيارات معالجة الصور
    const language = options.language || 'ara+eng';
    const quality = options.quality || 'balanced';
    
    // إعداد خيارات جودة التعرف
    let workerOptions: Partial<WorkerOptions> = {};
    
    if (quality === 'fast') {
      // خيارات أسرع ولكن أقل دقة
      workerOptions = {
        ...workerOptions,
        // @ts-ignore - هذه الخصائص موجودة في وقت التشغيل ولكن ليست في تعريفات الأنواع
        engineMode: 3, // مسار أسرع
        tessedit_pageseg_mode: '3' // وضع التجزئة بالصفحة الكاملة
      };
    } else if (quality === 'best') {
      // خيارات أكثر دقة ولكن أبطأ
      workerOptions = {
        ...workerOptions,
        // @ts-ignore - هذه الخصائص موجودة في وقت التشغيل ولكن ليست في تعريفات الأنواع
        engineMode: 1, // أكثر دقة
        tessedit_pageseg_mode: '11', // وضع التجزئة التحليلي الكامل
        tessedit_ocr_engine_mode: '2' // وضع LSTM فقط
      };
    }
    
    // إنشاء العامل مع خيارات مناسبة للغة العربية
    console.log(`إنشاء Tesseract worker باللغة: ${language}، الجودة: ${quality}`);
    const worker = await createWorker(workerOptions);
    console.log("تم إنشاء العامل بنجاح");
    
    // تحميل اللغات المناسبة
    console.log(`تحميل اللغة: ${language}`);
    await worker.loadLanguage(language);
    console.log(`تهيئة العامل باللغة: ${language}`);
    await worker.initialize(language);
    console.log("تم تهيئة العامل بنجاح");
    
    // معالجة الصورة إذا تم طلب ذلك
    console.log("تحويل الملف إلى بيانات الصورة...");
    let imageData = await fileToImageData(file);
    console.log("تم تحويل الملف إلى بيانات الصورة بنجاح");
    
    // التعرف على النص
    console.log("بدء التعرف على النص...");
    const { data } = await worker.recognize(imageData);
    console.log("تم الانتهاء من التعرف على النص بثقة:", data.confidence);
    
    await worker.terminate();
    console.log("تم إنهاء العامل");
    
    // تحسين النص المستخرج بتنظيف البيانات
    const enhancedText = enhanceExtractedText(data.text);
    
    return {
      text: enhancedText,
      confidence: data.confidence
    };
  } catch (error) {
    console.error('خطأ في معالجة OCR:', error);
    throw new Error('فشل في استخراج النص من الصورة');
  }
}

// دالة مساعدة لتحويل الملف إلى بيانات صورة
async function fileToImageData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log("نجحت قراءة الملف، طول بيانات الصورة:", reader.result.length);
        resolve(reader.result);
      } else {
        reject(new Error('فشل في تحويل الملف إلى بيانات صورة'));
      }
    };
    reader.onerror = () => {
      console.error("خطأ في FileReader:", reader.error);
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
}

// دالة لتحسين النص المستخرج
function enhanceExtractedText(text: string): string {
  // إزالة المسافات الزائدة
  let enhancedText = text.replace(/\s+/g, ' ').trim();
  
  // تحويل الأرقام العربية (٠١٢٣٤٥٦٧٨٩) إلى أرقام عربية شرقية (0123456789) للاتساق
  enhancedText = enhancedText.replace(/[\u0660-\u0669]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x0660 + 0x30);
  });
  
  // إزالة خطوط الأسطر المتكررة
  enhancedText = enhancedText.replace(/(\r\n|\n|\r){2,}/g, '\n');
  
  return enhancedText;
}

// دالة لتقييم نتائج استخراج البيانات وتعزيز دقتها
export function evaluateExtractedData(text: string): { 
  score: number; 
  suggestions: string[] 
} {
  const suggestions: string[] = [];
  let score = 100; // نبدأ بدرجة مثالية ونخفضها حسب المشاكل التي نجدها
  
  // فحص وجود الكود
  if (!text.match(/كود|code|رقم|رمز|[0-9]{5,}/gi)) {
    score -= 20; // Fixed from A20 to 20
    suggestions.push('لم يتم العثور على كود واضح في النص المستخرج.');
  }
  
  // فحص وجود اسم المرسل
  if (!text.match(/اسم|المرسل|الراسل|sender|name/gi)) {
    score -= 20;
    suggestions.push('لم يتم العثور على اسم المرسل في النص المستخرج.');
  }
  
  // فحص وجود رقم هاتف
  if (!text.match(/هاتف|جوال|موبايل|phone|[0-9]{10,}/gi)) {
    score -= 15;
    suggestions.push('لم يتم العثور على رقم هاتف واضح في النص المستخرج.');
  }
  
  // فحص وجود محافظة
  if (!text.match(/محافظة|مدينة|منطقة|province|city/gi)) {
    score -= 15;
    suggestions.push('لم يتم العثور على اسم المحافظة في النص المستخرج.');
  }
  
  // فحص وجود سعر
  if (!text.match(/سعر|ثمن|قيمة|مبلغ|price|cost|[0-9]+\s*(دينار|الف|ألف)/gi)) {
    score -= 15;
    suggestions.push('لم يتم العثور على سعر أو مبلغ في النص المستخرج.');
  }
  
  // تقييد النتيجة بين 0 و 100
  score = Math.max(0, Math.min(100, score));
  
  return { score, suggestions };
}

// دالة اختبار لمعايرة خيارات OCR
export async function testOcrSettings(
  file: File,
  languages: string[] = ['ara', 'ara+eng', 'eng+ara'],
  qualities: Array<'fast' | 'balanced' | 'best'> = ['fast', 'balanced', 'best']
): Promise<{ 
  bestResult: OcrResult & { language: string; quality: string }; 
  allResults: Array<OcrResult & { language: string; quality: string }>;
}> {
  console.log("Testing multiple OCR settings for optimal results...");
  
  const results: Array<OcrResult & { language: string; quality: string }> = [];
  
  for (const language of languages) {
    for (const quality of qualities) {
      try {
        console.log(`Testing with language: ${language}, quality: ${quality}`);
        const result = await extractTextFromImage(file, { language, quality });
        
        results.push({
          ...result,
          language,
          quality
        });
        
        console.log(`Result with ${language}/${quality}: Confidence ${result.confidence}`);
      } catch (error) {
        console.error(`Error testing ${language}/${quality}:`, error);
      }
    }
  }
  
  // ترتيب النتائج حسب الثقة
  results.sort((a, b) => b.confidence - a.confidence);
  
  console.log("Best OCR result:", results[0]);
  
  return {
    bestResult: results[0],
    allResults: results
  };
}
