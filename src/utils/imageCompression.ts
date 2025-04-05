
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
      options.maxSizeMB = 0.7;
      options.initialQuality = 0.6;
      options.maxWidthOrHeight = 1600;
    } else if (file.size > 2 * 1024 * 1024) {
      // للملفات الكبيرة (2-5 ميجابايت)
      options.maxSizeMB = 0.9;
      options.initialQuality = 0.7;
      options.maxWidthOrHeight = 1800;
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
    // خيارات مُحسّنة للتعرف على النصوص
    const ocrOptions = {
      maxSizeMB: 1.2,         // حجم أكبر قليلاً للحفاظ على جودة النص
      maxWidthOrHeight: 2400, // دقة أعلى للنصوص
      initialQuality: 0.85,   // جودة أعلى للنصوص
      useWebWorker: true,
    };
    
    // للصور الكبيرة جدًا، نقوم بضغط إضافي مع الحفاظ على الجودة
    if (file.size > 8 * 1024 * 1024) {
      ocrOptions.maxSizeMB = 0.9;
      ocrOptions.initialQuality = 0.7;
    }
    
    return await compressImage(file, ocrOptions);
  } catch (error) {
    console.error("خطأ في تحسين الصورة للتعرف على النصوص:", error);
    return file;
  }
}

/**
 * تطبيق الضغط التلقائي للصور قبل المعالجة
 * وظيفة مساعدة تستخدم في وحدة useFileUpload
 */
export async function autoCompressBeforeProcessing(file: File): Promise<File> {
  try {
    // للصور الصغيرة (أقل من 1 ميجابايت)، لا نقوم بالضغط
    if (file.size < 1024 * 1024) {
      return file;
    }
    
    // للصور بحجم 1-3 ميجابايت، نقوم بضغط خفيف
    if (file.size < 3 * 1024 * 1024) {
      return compressImage(file, {
        maxSizeMB: 0.9,
        initialQuality: 0.9
      });
    }
    
    // للصور الكبيرة، نقوم بضغط أكبر
    return enhanceImageForOCR(file);
  } catch (error) {
    console.error("خطأ في الضغط التلقائي للصورة:", error);
    return file;
  }
}

/**
 * تحويل الصورة إلى أبيض وأسود للتعرف على النصوص
 * ملحوظة: هذه الوظيفة تتطلب استخدام canvas وسيتم تنفيذها في تحديث مستقبلي
 */
export async function convertToBlackAndWhite(file: File): Promise<File> {
  // سيتم تنفيذها في تحديث مستقبلي
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(file);
            return;
          }
          
          // رسم الصورة على الكانفاس
          ctx.drawImage(img, 0, 0);
          
          // تحويل الصورة إلى أبيض وأسود
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // تعزيز التباين للتعرف على النصوص بشكل أفضل
            const newValue = avg < 128 ? 0 : 255;
            data[i] = newValue;     // أحمر
            data[i + 1] = newValue; // أخضر
            data[i + 2] = newValue; // أزرق
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // تحويل الكانفاس إلى blob ثم إلى ملف
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            const newFile = new File([blob], file.name, { type: 'image/png' });
            resolve(newFile);
          }, 'image/png');
        };
        
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("خطأ في تحويل الصورة إلى أبيض وأسود:", error);
    return file;
  }
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
