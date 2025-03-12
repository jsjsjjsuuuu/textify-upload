
/**
 * تنسيق السعر وفقًا لقواعد محددة للسوق العراقي:
 * - إذا كان السعر رقمًا صغيرًا أقل من 1000، اضربه في 1000
 * - إذا كان "مجاني" أو "توصيل" أو "واصل" أو "0"، اجعله صفرًا
 * - تعامل مع الأسعار بالدينار العراقي والدولار الأمريكي
 */
export function formatPrice(price: string): string {
  console.log(`تنسيق السعر: "${price}"`);
  
  // تحقق إذا كان السعر فارغًا
  if (!price || price.trim() === '') {
    console.log(`السعر فارغ، تعيينه إلى 0`);
    return '0';
  }
  
  // تحويل السعر إلى نص للتأكد
  const priceStr = price.toString();
  
  // التحقق مما إذا كان السعر "مجاني" أو "صفر" أو "توصيل" أو "واصل" أو ما شابه
  if (
    priceStr.toLowerCase().includes('free') || 
    priceStr.includes('مجان') || 
    priceStr === '0' ||
    priceStr.includes('صفر') || 
    priceStr.toLowerCase().includes('delivered') || 
    priceStr.toLowerCase().includes('delivery') ||
    priceStr.includes('توصيل') ||
    priceStr.includes('واصل') ||
    priceStr.includes('بدون') ||
    priceStr.includes('سلم') ||
    priceStr.includes('خدمة')
  ) {
    console.log(`السعر "${price}" تم تحديده كمجاني/توصيل/واصل، تعيينه إلى 0`);
    return '0';
  }
  
  // إزالة رموز العملة والكلمات غير المهمة
  let cleanedPrice = priceStr.replace(/[$€£د.ع]/g, ''); // إزالة رموز العملة
  cleanedPrice = cleanedPrice.replace(/دينار|دولار|عراقي|alf|الف|ألف|د\.ع\./gi, ''); // إزالة كلمات العملة
  
  // تنظيف قيمة السعر - إزالة الأحرف غير الرقمية باستثناء النقطة العشرية
  cleanedPrice = cleanedPrice.replace(/[^\d.]/g, '').trim();
  
  // التحقق من وجود قيمة بعد التنظيف
  if (!cleanedPrice || cleanedPrice === '') {
    console.log(`السعر "${price}" لا يحتوي على أرقام، تعيينه إلى 0`);
    return '0';
  }
  
  // إذا كان رقم صحيح (بدون فاصلة عشرية)
  if (/^\d+$/.test(cleanedPrice)) {
    const numValue = parseInt(cleanedPrice, 10);
    
    // إذا كان الرقم أقل من 1000 - يجب ضربه في 1000 (شائع في السوق العراقي)
    if (numValue > 0 && numValue < 1000) {
      const formattedPrice = (numValue * 1000).toString();
      console.log(`السعر "${price}" تم تحويله إلى ${formattedPrice} (ضرب × 1000)`);
      return formattedPrice;
    } else if (numValue >= 1000) {
      // إذا كان الرقم 1000 أو أكبر، نعيده كما هو
      console.log(`السعر "${price}" قيمته أكبر من 1000، الإبقاء عليه كما هو: ${numValue}`);
      return numValue.toString();
    }
  }
  
  // التعامل مع الأرقام العشرية (للدولار)
  if (cleanedPrice.includes('.')) {
    // إذا كان رقم عشري صغير (مثلاً $20.5)، قد يكون بالدولار - نحوله للدينار العراقي (تقريباً)
    const numValue = parseFloat(cleanedPrice);
    if (numValue > 0 && numValue < 100) {
      // تحويل تقريبي للدينار العراقي (سعر صرف تقريبي)
      const estimatedIQD = Math.round(numValue * 1300);
      console.log(`السعر "${price}" تم تحويله من دولار إلى دينار: ${estimatedIQD}`);
      return estimatedIQD.toString();
    }
  }
  
  // إذا وصلنا إلى هنا ولم نعالج القيمة، نعيد القيمة بعد التنظيف
  return cleanedPrice || '0';
}

/**
 * إنشاء رابط Blob موثوق من ملف
 */
export const createReliableBlobUrl = (file: File): string => {
  try {
    // إلغاء أي رابط Blob موجود أولاً لمنع تسرب الذاكرة
    const url = URL.createObjectURL(file);
    console.log("Created reliable blob URL:", url);
    return url;
  } catch (error) {
    console.error("Error creating blob URL:", error);
    return '';
  }
};

/**
 * التحقق من صحة رابط Blob
 */
export const isValidBlobUrl = async (url: string): Promise<boolean> => {
  if (!url || !url.startsWith('blob:')) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error("Error validating blob URL:", url, error);
    return false;
  }
};
