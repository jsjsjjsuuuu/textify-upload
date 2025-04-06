
/**
 * تحويل ملف إلى Base64 لاستخدامه مع API الخارجية
 */
export const fileToBase64 = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // استخراج بيانات Base64 من نتيجة القراءة
      const base64String = reader.result as string;
      const base64WithoutPrefix = base64String.split(',')[1];
      resolve(base64WithoutPrefix);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * تنسيق السعر للعرض
 */
export const formatPrice = (price: string | number | undefined): string => {
  if (!price) return '';
  
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price;
  
  if (isNaN(numericPrice)) return '';
  
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericPrice);
};

/**
 * إنشاء عنوان URL موثوق للكائنات Blob
 */
export const createReliableBlobUrl = (blob: Blob): string => {
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("خطأ في إنشاء عنوان URL للكائن Blob:", error);
    return '';
  }
};

/**
 * تحويل Blob إلى File (مطلوب لبعض وظائف معالجة الصور)
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  // إنشاء File من Blob
  const file = new File([blob], fileName, { type: blob.type });
  return file;
};
