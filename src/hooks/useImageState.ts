
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
    handleTextChange
  };
};
