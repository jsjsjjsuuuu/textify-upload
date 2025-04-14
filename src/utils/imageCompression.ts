
import imageCompression from "browser-image-compression";

/**
 * خيارات ضغط الصورة الافتراضية
 */
const defaultOptions = {
  maxSizeMB: 1,           // الحد الأقصى للحجم بالميجابايت
  maxWidthOrHeight: 1920, // الحد الأقصى للعرض أو الارتفاع
  useWebWorker: true,     // استخدام Web Worker لعدم تجميد واجهة المستخدم
  initialQuality: 0.8,    // جودة الصورة الأولية (0 إلى 1)
};

/**
 * ضغط الصورة للتحسين قبل المعالجة
 */
export async function compressImage(file: File, customOptions = {}): Promise<File> {
  try {
    console.log(`بدء ضغط الصورة: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // دمج الخيارات المخصصة مع الخيارات الافتراضية
    const options = { ...defaultOptions, ...customOptions };
    
    // ضبط خيارات الضغط بناءً على حجم الملف الأصلي
    if (file.size > 5 * 1024 * 1024) {
      // للملفات الكبيرة جدًا (أكثر من 5 ميجابايت)، نقوم بضغط أكبر
      options.maxSizeMB = 0.8;
      options.initialQuality = 0.7;
    } else if (file.size > 2 * 1024 * 1024) {
      // للملفات الكبيرة (2-5 ميجابايت)
      options.maxSizeMB = 1;
      options.initialQuality = 0.8;
    }
    
    // إجراء الضغط
    const compressedFile = await imageCompression(file, options);
    
    // إنشاء ملف جديد مع الاسم الأصلي للحفاظ على التوافق
    const compressedFileWithOriginalName = new File(
      [compressedFile], 
      file.name, 
      { type: compressedFile.type }
    );
    
    console.log(`اكتمل ضغط الصورة: ${file.name} (${(compressedFileWithOriginalName.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return compressedFileWithOriginalName;
  } catch (error) {
    console.error("خطأ في ضغط الصورة:", error);
    // إرجاع الملف الأصلي في حالة حدوث خطأ
    return file;
  }
}

/**
 * تحسين جودة الصورة للتعرف على النصوص
 */
export async function enhanceImageForOCR(file: File): Promise<File> {
  try {
    // في المستقبل، يمكن إضافة المزيد من تقنيات تحسين الصورة هنا
    
    // حاليًا، نقوم بالضغط فقط مع تعديل الخيارات للتعرف على النصوص
    const ocrOptions = {
      maxSizeMB: 1.5,         // حجم أكبر قليلاً للحفاظ على جودة النص
      maxWidthOrHeight: 2400, // دقة أعلى للنصوص
      initialQuality: 0.9,    // جودة أعلى للنصوص
    };
    
    return await compressImage(file, ocrOptions);
  } catch (error) {
    console.error("خطأ في تحسين الصورة للتعرف على النصوص:", error);
    return file;
  }
}

/**
 * تحويل الصورة إلى أبيض وأسود للتعرف على النصوص
 * (لتنفيذ في المستقبل)
 */
export async function convertToBlackAndWhite(file: File): Promise<File> {
  // سيتم تنفيذها في تحديث مستقبلي
  // حاليًا نعيد الملف كما هو
  return file;
}

/**
 * إزالة الضوضاء من الصورة للتعرف على النصوص بشكل أفضل
 * (لتنفيذ في المستقبل)
 */
export async function reduceNoise(file: File): Promise<File> {
  // سيتم تنفيذها في تحديث مستقبلي
  // حاليًا نعيد الملف كما هو
  return file;
}
