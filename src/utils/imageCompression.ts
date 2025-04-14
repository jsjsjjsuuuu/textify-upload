
/**
 * خيارات ضغط الصورة الافتراضية
 */
const defaultOptions = {
  maxSizeMB: 1,           // الحد الأقصى للحجم بالميجابايت
  maxWidthOrHeight: 1920, // الحد الأقصى للعرض أو الارتفاع
  initialQuality: 0.8,    // جودة الصورة الأولية (0 إلى 1)
};

/**
 * ضغط الصورة للتحسين قبل المعالجة عبر تقليل أبعادها
 */
export async function compressImage(file: File): Promise<File> {
  try {
    console.log(`بدء تحسين الصورة: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // إذا كان حجم الملف صغيرًا بالفعل، نعيده كما هو
    if (file.size <= 500 * 1024) { // أقل من 500 كيلوبايت
      return file;
    }
    
    // استخدام canvas لضغط الصورة
    const result = await compressWithCanvas(file);
    
    console.log(`اكتمل تحسين الصورة: ${file.name}, الحجم الجديد: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    
    return result;
  } catch (error) {
    console.error("خطأ في ضغط الصورة:", error);
    // إرجاع الملف الأصلي في حالة حدوث خطأ
    return file;
  }
}

/**
 * استخدام Canvas لضغط الصورة
 */
async function compressWithCanvas(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        // تحرير الذاكرة بعد الاستخدام
        URL.revokeObjectURL(img.src);
        
        // تحديد أبعاد الصورة بعد الضغط
        const { width, height } = calculateDimensions(img, 1920);
        
        // إنشاء canvas بالأبعاد الجديدة
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // رسم الصورة على canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('فشل إنشاء سياق القماش'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // تحويل canvas إلى blob
        const quality = file.size > 3 * 1024 * 1024 ? 0.65 : 0.85;
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('فشل إنشاء blob'));
              return;
            }
            
            // إنشاء ملف جديد من blob
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified
            });
            
            resolve(compressedFile);
            
            // التخلص من canvas بعد الاستخدام
            canvas.width = 0;
            canvas.height = 0;
          },
          file.type,
          quality
        );
      };
      
      img.onerror = (e) => {
        URL.revokeObjectURL(img.src);
        reject(new Error('فشل في تحميل الصورة'));
      };
      
      // تحميل الصورة
      img.src = URL.createObjectURL(file);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * حساب أبعاد الصورة المضغوطة مع الحفاظ على النسبة
 */
function calculateDimensions(img: HTMLImageElement, maxSize: number): { width: number, height: number } {
  let { width, height } = img;
  
  // إذا كانت الصورة أصغر من الحد الأقصى، نحتفظ بالأبعاد الأصلية
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  
  // الحفاظ على نسبة العرض إلى الارتفاع
  if (width > height) {
    height = Math.floor(height * (maxSize / width));
    width = maxSize;
  } else {
    width = Math.floor(width * (maxSize / height));
    height = maxSize;
  }
  
  return { width, height };
}
