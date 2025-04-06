
/**
 * وظائف قراءة الملفات والصور
 */

// قراءة الصورة وتحويلها إلى Base64 مع إمكانية الضغط
export const readImageFile = async (
  file: File | Blob, 
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error("فشل قراءة الملف"));
        }
        
        // إذا تم طلب ضغط الصورة
        if (quality < 1.0) {
          try {
            const compressedBase64 = await compressImage(event.target.result as string, quality);
            resolve(compressedBase64);
          } catch (error) {
            console.error("فشل ضغط الصورة:", error);
            // إرجاع الصورة الأصلية في حالة فشل الضغط
            resolve(event.target.result as string);
          }
        } else {
          // إرجاع الصورة الأصلية إذا لم يطلب الضغط
          resolve(event.target.result as string);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("حدث خطأ أثناء قراءة الملف"));
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      reject(new Error(`فشل قراءة الملف: ${error.message}`));
    }
  });
};

// ضغط الصورة باستخدام canvas
const compressImage = async (
  base64Image: string, 
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.src = base64Image;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          return reject(new Error("فشل إنشاء سياق canvas"));
        }
        
        // الحفاظ على أبعاد الصورة الأصلية
        canvas.width = img.width;
        canvas.height = img.height;
        
        // رسم الصورة على الكانفاس
        ctx.drawImage(img, 0, 0);
        
        // تحويل الصورة مع الضغط
        const compressedImageData = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedImageData);
      };
      
      img.onerror = () => {
        reject(new Error("فشل تحميل الصورة للضغط"));
      };
    } catch (error: any) {
      reject(new Error(`فشل ضغط الصورة: ${error.message}`));
    }
  });
};

// وظيفة حساب هاش للصورة لمنع التكرار
export const calculateImageHash = async (file: File | Blob): Promise<string> => {
  try {
    // قراءة الصورة كـ base64 بجودة منخفضة لحساب هاش سريع
    const base64Data = await readImageFile(file, 0.5);
    
    // استخدام أول 1000 حرف من البيانات المشفرة كتقريب للهاش
    // هذا ليس هاشًا حقيقيًا، ولكنه يعمل بشكل جيد للكشف عن الصور المتطابقة
    const hashBase = base64Data.substring(0, 1000);
    
    // حساب هاش بسيط من البيانات
    let hash = 0;
    for (let i = 0; i < hashBase.length; i++) {
      const char = hashBase.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // تحويل إلى 32bit integer
    }
    
    return hash.toString(36); // تحويل إلى base36 للحصول على سلسلة أقصر
  } catch (error) {
    console.error("خطأ في حساب هاش الصورة:", error);
    return Date.now().toString(36); // في حالة الفشل، استخدم الطابع الزمني كهاش
  }
};
