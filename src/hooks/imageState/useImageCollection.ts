
import { useCallback, useState } from "react";
import { ImageData } from "@/types/ImageData";

export const useImageCollection = (hiddenImageIds: string[]) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [sessionImages, setSessionImages] = useState<ImageData[]>([]);

  // إنشاء عنوان Data URL آمن بدلاً من Blob URL
  const createSafeObjectURL = useCallback((file: File): string => {
    // استخدام FileReader لتحويل الملف إلى Data URL بشكل مباشر
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }) as unknown as string;
  }, []);

  // إضافة صورة جديدة
  const addImage = useCallback((newImage: ImageData) => {
    // تجاهل إضافة الصور المخفية
    if (hiddenImageIds.includes(newImage.id)) {
      console.log(`تجاهل إضافة صورة مخفية: ${newImage.id}`);
      return;
    }
    
    // التأكد من أن لدينا عنوان معاينة آمن للصورة
    const imageWithSafeUrl = { ...newImage };
    if (newImage.file && (!newImage.previewUrl || newImage.previewUrl.startsWith('blob:'))) {
      // استخدام Data URL بدلاً من Blob URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // تحديث الصورة بعنوان Data URL الآمن
        setImages(prev => prev.map(img => 
          img.id === newImage.id ? { ...img, previewUrl: dataUrl } : img
        ));
        
        // تحديث الصورة في قائمة الصور المؤقتة إذا كانت موجودة هناك
        if (newImage.sessionImage) {
          setSessionImages(prev => prev.map(img => 
            img.id === newImage.id ? { ...img, previewUrl: dataUrl } : img
          ));
        }
      };
      reader.readAsDataURL(newImage.file);
      // نضع مؤقتًا عنوان فارغ حتى يكتمل تحميل Data URL
      imageWithSafeUrl.previewUrl = "loading"; 
    }
    
    setImages(prev => [...prev, imageWithSafeUrl]);
    
    // إذا كانت الصورة من جلسة مؤقتة، نضيفها للصور المؤقتة أيضًا
    if (newImage.sessionImage) {
      setSessionImages(prev => [...prev, imageWithSafeUrl]);
    }
  }, [hiddenImageIds]);

  // تحديث بيانات صورة بناءً على المعرف
  const updateImage = useCallback((id: string, updatedFields: Partial<ImageData>) => {
    setImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, ...updatedFields } : img
      )
    );
  }, []);

  // تحديث بيانات النص
  const handleTextChange = useCallback((id: string, field: string, value: string) => {
    updateImage(id, { [field]: value } as any);
  }, [updateImage]);

  // حذف صورة من العرض فقط
  const deleteImage = useCallback((id: string, removeFromDatabase: boolean = false) => {
    // حذف الصورة من العرض المحلي
    setImages(prev => prev.filter(img => img.id !== id));
    setSessionImages(prev => prev.filter(img => img.id !== id));
    
    return true;
  }, []);

  // مسح جميع الصور
  const clearImages = useCallback(() => {
    setImages([]);
    setSessionImages([]);
  }, []);

  // مسح الصور المؤقتة فقط
  const clearSessionImages = useCallback(() => {
    setImages(prev => prev.filter(img => !img.sessionImage));
    setSessionImages([]);
  }, []);

  // تعيين قائمة الصور مباشرة
  const setAllImages = useCallback((newImages: ImageData[]) => {
    // تصفية الصور المخفية من القائمة الجديدة
    const filteredImages = newImages.filter(img => !hiddenImageIds.includes(img.id));
    
    // معالجة الصور للتأكد من أن لديها روابط معاينة آمنة
    const processedImages = filteredImages.map(img => {
      // إذا كان لدينا ملف ولكن الرابط غير آمن، نقوم بتحويله إلى Data URL
      if (img.file && (!img.previewUrl || img.previewUrl.startsWith('blob:'))) {
        // نترك previewUrl كما هو الآن، وسنقوم بتحديثه بعد قراءة الملف
        const processedImg = { ...img, previewUrl: "loading" };
        
        // قراءة الملف وتحديث الصورة لاحقًا
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setImages(current => 
            current.map(currentImg => 
              currentImg.id === img.id ? { ...currentImg, previewUrl: dataUrl } : currentImg
            )
          );
        };
        reader.readAsDataURL(img.file);
        return processedImg;
      }
      return img;
    });
    
    setImages(processedImages);
    
    // تحديث الصور المؤقتة أيضًا
    const sessionOnly = processedImages.filter(img => img.sessionImage);
    setSessionImages(sessionOnly);
  }, [hiddenImageIds]);

  // إضافة صور من قاعدة البيانات (الصور الدائمة)
  const addDatabaseImages = useCallback((dbImages: ImageData[]) => {
    setImages(prev => {
      // استبعاد الصور الموجودة بالفعل والصور المخفية
      const newImages = dbImages.filter(dbImg => 
        !prev.some(existingImg => existingImg.id === dbImg.id) && 
        !hiddenImageIds.includes(dbImg.id)
      );
      
      // معالجة الصور للتأكد من أن لديها روابط معاينة آمنة
      const processedImages = newImages.map(img => {
        if (img.file && (!img.previewUrl || img.previewUrl.startsWith('blob:'))) {
          // نفس المنطق السابق لتحويل الصور إلى Data URLs
          const processedImg = { ...img, previewUrl: "loading" };
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setImages(current => 
              current.map(currentImg => 
                currentImg.id === img.id ? { ...currentImg, previewUrl: dataUrl } : currentImg
              )
            );
          };
          reader.readAsDataURL(img.file);
          return processedImg;
        }
        return img;
      });
      
      return [...prev, ...processedImages];
    });
  }, [hiddenImageIds]);

  return {
    images,
    sessionImages,
    addImage,
    updateImage,
    deleteImage,
    clearImages,
    clearSessionImages,
    setAllImages,
    addDatabaseImages,
    handleTextChange,
    createSafeObjectURL
  };
};
