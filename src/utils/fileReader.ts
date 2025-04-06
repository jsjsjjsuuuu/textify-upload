
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
    } catch (error) {
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
    } catch (error) {
      reject(new Error(`فشل ضغط الصورة: ${error.message}`));
    }
  });
};
