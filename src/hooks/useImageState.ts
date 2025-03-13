
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAllImages,
  saveImageData,
  updateImageData,
  deleteImageData,
  DbImageData,
  fromDbFormat
} from "@/lib/supabaseService";
import { useAuth } from "@/hooks/useAuth";

export const useImageState = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // جلب جميع الصور عند بدء التطبيق أو عند تغيير الشركة النشطة
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      setConnectionError(null);
      
      try {
        // استخدام معرف الشركة النشطة من المستخدم الحالي إذا كان متاحًا
        const companyId = user?.activeCompanyId;
        console.log("محاولة تحميل الصور للشركة:", companyId || "جميع الشركات");
        
        const { success, data, error } = await fetchAllImages(companyId);
        
        if (success && data) {
          console.log("تم استرجاع", data.length, "صورة من قاعدة البيانات");
          // تحويل البيانات من قاعدة البيانات إلى نموذج ImageData
          const loadedImages: ImageData[] = [];
          
          for (const dbImage of data) {
            try {
              // إنشاء كائن File وهمي (لأننا لا نستطيع استعادة الملف الأصلي)
              const dummyFile = new File([""], dbImage.file_name, {
                type: "image/jpeg", // نفترض أنه jpeg، يمكن استخراج النوع الحقيقي من اسم الملف
              });
              
              // تحويل البيانات من تنسيق قاعدة البيانات
              const imageData = {
                ...fromDbFormat(dbImage, dummyFile),
                date: new Date(dbImage.created_at),
                number: loadedImages.length + 1,
              } as ImageData;
              
              loadedImages.push(imageData);
            } catch (e) {
              console.error('خطأ في تحويل بيانات الصورة:', e);
            }
          }
          
          setImages(loadedImages);
          console.log("تم تحميل", loadedImages.length, "صورة بنجاح");
        } else if (error) {
          console.error('خطأ في جلب الصور:', error);
          setConnectionError(error);
          toast({
            title: "خطأ في تحميل البيانات",
            description: error,
            variant: "destructive"
          });
        }
      } catch (e) {
        console.error('خطأ غير متوقع:', e);
        setConnectionError(String(e));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImages();
  }, [toast, user?.activeCompanyId]);

  const addImage = async (newImage: ImageData) => {
    // إضافة معرف الشركة النشطة من المستخدم الحالي
    if (user?.activeCompanyId) {
      newImage.companyId = user.activeCompanyId;
    }
    
    // إضافة الصورة إلى الحالة المحلية أولاً
    setImages(prev => [newImage, ...prev]);
    
    // حفظ الصورة في قاعدة البيانات
    try {
      const { success, error } = await saveImageData(newImage);
      
      if (!success) {
        toast({
          title: "خطأ في حفظ الصورة",
          description: error,
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error('خطأ في حفظ الصورة:', e);
    }
  };

  const updateImage = async (id: string, updatedFields: Partial<ImageData>) => {
    // تحديث الصورة في الحالة المحلية أولاً
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updatedFields } : img
    ));
    
    // تحديث الصورة في قاعدة البيانات
    try {
      const { success, error } = await updateImageData(id, updatedFields);
      
      if (!success) {
        console.error('خطأ في تحديث الصورة:', error);
      }
    } catch (e) {
      console.error('خطأ في تحديث الصورة:', e);
    }
  };

  const deleteImage = async (id: string) => {
    // حذف الصورة من الحالة المحلية أولاً
    setImages(prev => prev.filter(img => img.id !== id));
    
    // حذف الصورة من قاعدة البيانات
    try {
      const { success, error } = await deleteImageData(id);
      
      if (success) {
        toast({
          title: "تم الحذف",
          description: "تم حذف الصورة بنجاح"
        });
      } else {
        console.error('خطأ في حذف الصورة:', error);
        toast({
          title: "خطأ في الحذف",
          description: error,
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error('خطأ في حذف الصورة:', e);
    }
  };

  const handleTextChange = (id: string, field: string, value: string) => {
    console.log(`Updating ${field} to "${value}" for image ${id}`);
    updateImage(id, { [field]: value } as any);
  };

  // Get sorted images
  const getSortedImages = () => {
    return [...images].sort((a, b) => {
      const aNum = a.number || 0;
      const bNum = b.number || 0;
      return bNum - aNum;
    });
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  return {
    images: getSortedImages(),
    isLoading,
    connectionError,
    addImage,
    updateImage,
    deleteImage,
    handleTextChange
  };
};
