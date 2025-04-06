
import { ImageData } from "@/types/ImageData";
import CryptoJS from "crypto-js";

// مجموعة لتخزين هاشات الصور المعالجة في ذاكرة التخزين المؤقت
const processedImageHashes = new Set<string>();

/**
 * تحميل هاشات الصور المعالجة من التخزين المحلي
 */
export function loadProcessedHashesFromStorage(): void {
  try {
    const storedHashes = localStorage.getItem('processedImageHashes');
    if (storedHashes) {
      const hashesArray = JSON.parse(storedHashes);
      
      // تهيئة المجموعة بالهاشات المخزنة
      hashesArray.forEach((hash: string) => {
        processedImageHashes.add(hash);
      });
      
      console.log(`تم تحميل ${processedImageHashes.size} هاش للصور المعالجة`);
    }
  } catch (error) {
    console.error("خطأ في تحميل هاشات الصور المعالجة:", error);
  }
}

/**
 * تحديث التخزين المحلي بالهاشات المعالجة الحالية
 */
function updateProcessedHashesStorage(): void {
  try {
    const hashesArray = Array.from(processedImageHashes);
    if (hashesArray.length > 1000) {
      // الاحتفاظ بآخر 1000 هاش فقط لتجنب التضخم
      hashesArray.splice(0, hashesArray.length - 1000);
    }
    localStorage.setItem('processedImageHashes', JSON.stringify(hashesArray));
  } catch (error) {
    console.error("خطأ في حفظ هاشات الصور المعالجة:", error);
  }
}

/**
 * وضع علامة على صورة بأنها تمت معالجتها
 */
export function markImageAsProcessed(imageHash: string): void {
  if (imageHash && !processedImageHashes.has(imageHash)) {
    processedImageHashes.add(imageHash);
    updateProcessedHashesStorage();
    console.log(`تمت إضافة الهاش ${imageHash.substring(0, 10)}... إلى قائمة الصور المعالجة`);
  }
}

/**
 * التحقق مما إذا كانت الصورة مكررة (تم معالجتها بالفعل)
 */
export async function isDuplicateImage(image: ImageData, allImages: ImageData[]): Promise<boolean> {
  // التحقق من وجود هاش الصورة
  if (image.imageHash && processedImageHashes.has(image.imageHash)) {
    console.log(`الصورة ${image.id} مكررة استنادًا إلى الهاش المخزن`);
    return true;
  }
  
  // المزيد من عمليات التحقق من التكرار
  if (image.sessionImage) {
    // تحقق إضافي للصور المؤقتة
    const duplicates = allImages.filter(img => 
      // التحقق من الهاش إذا كان متاحًا
      (image.imageHash && img.imageHash && img.imageHash === image.imageHash) ||
      // أو تحقق من خصائص أخرى
      (img.id !== image.id && img.file && image.file && img.file.name === image.file.name) ||
      // أو التحقق من URLs المعاينة
      (img.previewUrl && image.previewUrl && img.previewUrl === image.previewUrl)
    );
    
    return duplicates.length > 0;
  }
  
  return false;
}
