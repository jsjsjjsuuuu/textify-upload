
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
  console.log("Starting OCR extraction process for file:", file.name, "with options:", options);
  try {
    // إعداد خيارات معالجة الصور
    const language = options.language || 'ara';
    const quality = options.quality || 'balanced';
    
    // إعداد خيارات جودة التعرف
    let workerOptions: Partial<WorkerOptions> = {};
    
    if (quality === 'fast') {
      // Set faster but less accurate options using object notation
      // since engineMode is not in the type definition
      workerOptions = {
        ...workerOptions,
        // @ts-ignore - These properties exist at runtime but not in type definitions
        engineMode: 3, // مسار أسرع
        tessedit_pageseg_mode: '3' // وضع التجزئة بالصفحة الكاملة
      };
    } else if (quality === 'best') {
      // Set more accurate but slower options
      workerOptions = {
        ...workerOptions,
        // @ts-ignore - These properties exist at runtime but not in type definitions
        engineMode: 1, // أكثر دقة
        tessedit_pageseg_mode: '11', // وضع التجزئة التحليلي الكامل
        tessedit_ocr_engine_mode: '2' // وضع LSTM فقط
      };
    }
    
    // إنشاء العامل مع خيارات مناسبة للغة العربية
    console.log(`Creating Tesseract worker with language: ${language}, quality: ${quality}`);
    const worker = await createWorker(workerOptions);
    console.log("Worker created successfully");
    
    // تحميل اللغات المناسبة
    console.log(`Loading language: ${language}`);
    await worker.loadLanguage(language);
    console.log(`Initializing worker with language: ${language}`);
    await worker.initialize(language);
    console.log("Worker initialized successfully");
    
    // معالجة الصورة إذا تم طلب ذلك
    console.log("Converting file to image data...");
    let imageData = await fileToImageData(file);
    console.log("File converted to image data successfully");
    
    // التعرف على النص
    console.log("Starting text recognition...");
    const { data } = await worker.recognize(imageData);
    console.log("Text recognition completed with confidence:", data.confidence);
    
    await worker.terminate();
    console.log("Worker terminated");
    
    // تحسين النص المستخرج بتنظيف البيانات
    const enhancedText = enhanceExtractedText(data.text);
    
    return {
      text: enhancedText,
      confidence: data.confidence
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to extract text from image');
  }
}

// دالة مساعدة لتحويل الملف إلى بيانات صورة
async function fileToImageData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log("File read successful, image data length:", reader.result.length);
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to image data'));
      }
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
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
