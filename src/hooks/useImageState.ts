
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useImageState = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const { toast } = useToast();

  const addImage = (newImage: ImageData) => {
    // التأكد من أن الصورة الجديدة تحتوي على حقل status بشكل افتراضي
    const imageWithDefaults: ImageData = {
      status: "pending", // قيمة افتراضية
      ...newImage
    };
    console.log("إضافة صورة جديدة:", imageWithDefaults.id);
    
    // تحسين منطق التحقق من التكرار - التحقق من المعرف وعنوان URL للمعاينة وملف الصورة
    const exists = images.some(img => 
      img.id === imageWithDefaults.id || 
      (img.previewUrl && img.previewUrl === imageWithDefaults.previewUrl) ||
      (img.file && imageWithDefaults.file && 
       img.file.name === imageWithDefaults.file.name && 
       img.file.size === imageWithDefaults.file.size &&
       img.file.lastModified === imageWithDefaults.file.lastModified)
    );
    
    if (exists) {
      console.log("الصورة موجودة بالفعل، تجاهل الإضافة:", imageWithDefaults.id);
      return;
    }
    
    setImages(prev => [imageWithDefaults, ...prev]);
  };

  const updateImage = (id: string, updatedFields: Partial<ImageData>) => {
    console.log("تحديث الصورة:", id, updatedFields);
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updatedFields } : img
    ));
  };

  const deleteImage = (id: string) => {
    console.log("حذف الصورة:", id);
    setImages(prev => prev.filter(img => img.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الصورة بنجاح"
    });
  };

  const handleTextChange = (id: string, field: string, value: string) => {
    console.log(`تحديث حقل ${field} للصورة ${id} بالقيمة: "${value}"`);
    
    // إذا كان الحقل من الحقول الأساسية وأصبح لدينا جميع الحقول المطلوبة، نحدث الحالة إلى "مكتمل"
    const image = images.find(img => img.id === id);
    if (image) {
      const updatedImage = { ...image, [field]: value };
      
      // التحقق مما إذا كانت جميع الحقول الأساسية مكتملة
      if (updatedImage.code && updatedImage.senderName && updatedImage.phoneNumber) {
        updateImage(id, { [field]: value, status: "completed" });
      } else {
        updateImage(id, { [field]: value });
      }
    } else {
      console.warn("لم يتم العثور على الصورة بالمعرف:", id);
    }
  };

  // الحصول على الصور مرتبة
  const getSortedImages = () => {
    return [...images].sort((a, b) => {
      const aNum = a.number || 0;
      const bNum = b.number || 0;
      return bNum - aNum;
    });
  };
  
  // إعادة تعيين الترقيم للصور
  const renumberImages = () => {
    const sortedImages = getSortedImages();
    sortedImages.forEach((img, index) => {
      const newNumber = sortedImages.length - index;
      if (img.number !== newNumber) {
        updateImage(img.id, { number: newNumber });
      }
    });
  };

  // تحسين منطق إزالة التكرار
  const removeDuplicates = () => {
    console.log("بدء عملية إزالة التكرار، عدد الصور الحالي:", images.length);
    
    // استخدام Map للتعامل مع السجلات المكررة بشكل أكثر ذكاءً
    const uniqueImageMap = new Map<string, ImageData>();
    const fileSignatureMap = new Map<string, string[]>();
    const removedIds = new Set<string>();
    
    // إنشاء توقيع فريد لكل صورة باستخدام بيانات الملف
    images.forEach(img => {
      const fileSignature = img.file ? 
        `${img.file.name}_${img.file.size}_${img.file.type}` : 
        (img.previewUrl || img.id);
      
      // إذا كان لدينا نفس توقيع الملف، نتحقق من المعرف للحصول على أحدث نسخة
      if (fileSignatureMap.has(fileSignature)) {
        const existingIds = fileSignatureMap.get(fileSignature) || [];
        
        // اختيار الصورة الأحدث أو المكتملة
        const existingImgs = existingIds.map(id => uniqueImageMap.get(id)!);
        const bestExistingImg = existingImgs.reduce((best, current) => {
          // الأفضلية للمكتملة أو التي تم إرسالها
          if (current.submitted && !best.submitted) return current;
          if (current.status === "completed" && best.status !== "completed") return current;
          
          // عدا ذلك، استخدم الأحدث
          return current.date > best.date ? current : best;
        }, existingImgs[0]);
        
        // إذا كانت الصورة الحالية أحدث أو أفضل، استبدل
        if ((img.submitted && !bestExistingImg.submitted) || 
            (img.status === "completed" && bestExistingImg.status !== "completed") ||
            (img.date > bestExistingImg.date)) {
          // أضف هذه الصورة الجديدة الأفضل
          uniqueImageMap.set(img.id, img);
          fileSignatureMap.set(fileSignature, [...existingIds, img.id]);
          
          // ضع علامة على الصور الأقدم لإزالتها
          existingIds.forEach(id => {
            if (id !== img.id) removedIds.add(id);
          });
        } else {
          // الصورة الحالية ليست أفضل، ضع علامة لإزالتها
          removedIds.add(img.id);
        }
      } else {
        // هذه صورة جديدة فريدة
        uniqueImageMap.set(img.id, img);
        fileSignatureMap.set(fileSignature, [img.id]);
      }
    });
    
    // إزالة الصور المكررة من الخريطة
    removedIds.forEach(id => {
      uniqueImageMap.delete(id);
    });
    
    // تحويل الخريطة إلى مصفوفة
    const uniqueImages = Array.from(uniqueImageMap.values());
    
    console.log(`عدد الصور بعد إزالة التكرار: ${uniqueImages.length} (تم إزالة ${images.length - uniqueImages.length} صورة مكررة)`);
    
    // تحديث الحالة فقط إذا اختلف عدد الصور
    if (uniqueImages.length !== images.length) {
      setImages(uniqueImages);
      return true;
    }
    
    return false;
  };

  // تنظيف عناوين URL للكائنات عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      console.log("تنظيف عناوين URL للكائنات");
      images.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  return {
    images: getSortedImages(),
    addImage,
    updateImage,
    deleteImage,
    handleTextChange,
    setImages, // إضافة الوظيفة الجديدة للتحكم المباشر في مجموعة الصور
    renumberImages, // إضافة وظيفة إعادة ترقيم الصور
    removeDuplicates // إضافة وظيفة جديدة لإزالة الصور المكررة
  };
};
