
import { ImageData } from "@/types/ImageData";
import { calculateImageHash } from "./fileReader";

// تخزين هاشات الصور المعالجة بالفعل
const processedImageHashes = new Set<string>();

// تخزين هاشات الصور في جلسة حالية
const sessionImageHashes = new Map<string, boolean>();

// وظيفة للتحقق مما إذا كانت الصورة مكررة
export const isDuplicateImage = async (image: ImageData, allImages: ImageData[]): Promise<boolean> => {
  try {
    // إذا لم يكن هناك ملف، لا يمكننا معرفة ما إذا كانت مكررة
    if (!image.file) {
      console.log("لا يمكن التحقق من تكرار الصورة: لا يوجد ملف", image.id);
      return false;
    }
    
    // 1. استخدام هاش الصورة المخزن إذا كان موجوداً
    if (image.imageHash) {
      // التحقق من كاش التكرارات المحلي
      if (processedImageHashes.has(image.imageHash)) {
        console.log(`تم اكتشاف صورة مكررة باستخدام الهاش المخزن: ${image.imageHash}`);
        return true;
      }
      
      // البحث عن الهاش في قائمة الصور الحالية
      const duplicateByHash = allImages.some(existingImage => 
        existingImage.id !== image.id && 
        existingImage.imageHash === image.imageHash
      );
      
      if (duplicateByHash) {
        console.log(`تم اكتشاف صورة مكررة من خلال مقارنة الهاش: ${image.imageHash}`);
        return true;
      }
    }
    
    // 2. في حالة عدم وجود هاش مخزن، نقوم بحساب الهاش
    const newHash = await calculateImageHash(image.file);
    image.imageHash = newHash;
    
    // التحقق من كاش التكرارات المحلي
    if (processedImageHashes.has(newHash)) {
      console.log(`تم اكتشاف صورة مكررة باستخدام الهاش الجديد: ${newHash}`);
      return true;
    }
    
    // البحث عن الهاش في قائمة الصور الحالية
    const duplicateByNewHash = allImages.some(existingImage => 
      existingImage.id !== image.id && 
      existingImage.imageHash === newHash
    );
    
    if (duplicateByNewHash) {
      console.log(`تم اكتشاف صورة مكررة باستخدام الهاش الجديد: ${newHash}`);
      return true;
    }
    
    // 3. نقوم بتخزين الهاش للاستخدام المستقبلي
    processedImageHashes.add(newHash);
    
    // إذا كانت صورة جلسة، نضيفها إلى خريطة هاشات الجلسة
    if (image.sessionImage) {
      sessionImageHashes.set(image.id, true);
    }
    
    // لم يتم العثور على تكرار
    return false;
  } catch (error) {
    console.error("خطأ أثناء التحقق من تكرار الصورة:", error);
    // في حالة وجود خطأ، نفترض أن الصورة غير مكررة
    return false;
  }
};

// وظيفة لتنظيف هاشات الصور المعالجة
export const clearProcessedHashes = (): void => {
  processedImageHashes.clear();
  console.log("تم مسح كاش هاشات الصور المعالجة");
};

// وظيفة للتحقق من أن الصورة تمت معالجتها بالفعل
export const markImageAsProcessed = (imageHash: string): void => {
  processedImageHashes.add(imageHash);
  
  // تخزين الهاش في localStorage أيضًا للاستمرار بين تحديثات الصفحة
  try {
    // الحصول على قائمة الهاشات المخزنة
    const storedHashes = JSON.parse(localStorage.getItem('processedImageHashes') || '[]');
    
    // إضافة الهاش إذا لم يكن موجوداً بالفعل
    if (!storedHashes.includes(imageHash)) {
      storedHashes.push(imageHash);
      
      // تحديد عدد الهاشات التي سيتم الاحتفاظ بها لتجنب تضخم التخزين المحلي
      const maxStoredHashes = 500;
      const trimmedHashes = storedHashes.slice(-maxStoredHashes);
      
      localStorage.setItem('processedImageHashes', JSON.stringify(trimmedHashes));
    }
  } catch (error) {
    console.error("خطأ في تخزين هاش الصورة المعالجة في التخزين المحلي:", error);
  }
};

// وظيفة لتحميل هاشات الصور المعالجة من التخزين المحلي
export const loadProcessedHashesFromStorage = (): void => {
  try {
    const storedHashes = JSON.parse(localStorage.getItem('processedImageHashes') || '[]');
    
    storedHashes.forEach((hash: string) => {
      processedImageHashes.add(hash);
    });
    
    console.log(`تم تحميل ${processedImageHashes.size} هاش من التخزين المحلي`);
  } catch (error) {
    console.error("خطأ في تحميل هاشات الصور المعالجة من التخزين المحلي:", error);
  }
};

// وظيفة لإزالة الصور المكررة من قائمة الصور
export const removeDuplicateImages = (images: ImageData[]): ImageData[] => {
  const uniqueHashes = new Set<string>();
  const uniqueImages: ImageData[] = [];
  
  for (const image of images) {
    if (image.imageHash) {
      if (!uniqueHashes.has(image.imageHash)) {
        uniqueHashes.add(image.imageHash);
        uniqueImages.push(image);
      } else {
        console.log(`تم حذف صورة مكررة: ${image.id} - الهاش: ${image.imageHash}`);
      }
    } else {
      // إذا لم يكن هناك هاش، نحتفظ بالصورة
      uniqueImages.push(image);
    }
  }
  
  console.log(`تم إزالة ${images.length - uniqueImages.length} صور مكررة`);
  return uniqueImages;
};
