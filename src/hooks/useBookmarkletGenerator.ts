
import { useEffect, useState, useCallback } from "react";
import { createBookmarkletCode, createBatchBookmarkletCode } from "@/lib/gemini";
import { ImageData } from "@/types/ImageData";

interface BookmarkletOptions {
  clickSubmitButton?: boolean;
}

// Hook خاص بإنشاء الـ bookmarklet
export const useBookmarkletGenerator = (
  imageData: ImageData | null,
  multipleImages: ImageData[] = [],
  isMultiMode = false,
  isOpen = false
) => {
  const [bookmarkletUrl, setBookmarkletUrl] = useState<string>("");
  const [bookmarkletCode, setBookmarkletCode] = useState<string>("");
  const [rawDataObject, setRawDataObject] = useState<Record<string, any>>({});

  // تحديث الـ bookmarklet عند فتح مربع الحوار أو عند تغيير البيانات
  useEffect(() => {
    if (!isOpen) return;
    
    if (isMultiMode && multipleImages.length > 0) {
      generateBatchBookmarklet(multipleImages);
    } else if (imageData) {
      generateSingleBookmarklet(imageData);
    }
  }, [isOpen, imageData, multipleImages, isMultiMode]);

  // إنشاء bookmarklet للصورة الواحدة
  const generateSingleBookmarklet = (data: ImageData) => {
    // تحضير كائن البيانات للسكريبت
    const exportData = {
      code: data.code || "",
      senderName: data.senderName || "",
      phoneNumber: data.phoneNumber || "",
      province: data.province || "",
      price: data.price || "",
      companyName: data.companyName || ""
    };
    
    // حفظ البيانات الخام للاستخدام المباشر
    setRawDataObject(exportData);
    
    try {
      // إنشاء الكود مع وظيفة ضغط زر الحفظ
      const code = createBookmarkletCode({
        ...data,
        options: { clickSubmitButton: true }
      });
      setBookmarkletCode(code);
      
      // إنشاء الرابط
      const url = `javascript:${encodeURIComponent(code)}`;
      setBookmarkletUrl(url);
    } catch (error) {
      console.error("خطأ في إنشاء الـ bookmarklet:", error);
      setBookmarkletUrl(`javascript:alert('حدث خطأ في إنشاء الـ bookmarklet: ${error}')`);
    }
  };

  // إنشاء bookmarklet لمجموعة من الصور
  const generateBatchBookmarklet = (images: ImageData[]) => {
    // فلترة البيانات لاستبعاد الصور بدون بيانات
    const filteredImages = images.filter(img => 
      img.code || img.senderName || img.phoneNumber || img.province || img.price
    );
    
    if (filteredImages.length === 0) {
      setBookmarkletUrl(`javascript:alert('لا توجد بيانات كافية لإنشاء الـ bookmarklet')`);
      return;
    }
    
    // حفظ مصفوفة البيانات
    setRawDataObject({ multipleImages: filteredImages });
    
    try {
      // إنشاء الكود للبيانات المتعددة مع وظيفة ضغط زر الحفظ
      const code = createBatchBookmarkletCode(filteredImages.map(img => ({
        ...img,
        options: { clickSubmitButton: true }
      })));
      setBookmarkletCode(code);
      
      // إنشاء الرابط
      const url = `javascript:${encodeURIComponent(code)}`;
      setBookmarkletUrl(url);
    } catch (error) {
      console.error("خطأ في إنشاء الـ bookmarklet للبيانات المتعددة:", error);
      setBookmarkletUrl(`javascript:alert('حدث خطأ في إنشاء الـ bookmarklet: ${error}')`);
    }
  };

  // تنفيذ السكريبت مباشرة في الموقع المستهدف
  const executeScript = useCallback((targetUrl: string, options?: BookmarkletOptions) => {
    // التحقق من وجود إطار عرض الموقع
    const previewFrame = document.querySelector('iframe') as HTMLIFrameElement;
    if (!previewFrame) {
      console.error("لم يتم العثور على إطار عرض الموقع");
      
      // فتح نافذة جديدة وتنفيذ السكريبت فيها
      const newWindow = window.open(targetUrl, '_blank');
      if (newWindow) {
        // تأخير لضمان تحميل الصفحة
        setTimeout(() => {
          try {
            const scriptElement = newWindow.document.createElement('script');
            scriptElement.textContent = bookmarkletCode;
            newWindow.document.head.appendChild(scriptElement);
          } catch (error) {
            console.error("خطأ في تنفيذ السكريبت في النافذة الجديدة:", error);
          }
        }, 2000);
      }
      return;
    }
    
    try {
      // تنفيذ السكريبت في الإطار مع توفير البيانات
      previewFrame.contentWindow?.postMessage({
        type: 'execute-script',
        script: bookmarkletCode,
        data: { 
          ...rawDataObject,
          options: { ...options, clickSubmitButton: true }
        }
      }, '*');
      
      console.log("تم إرسال طلب تنفيذ السكريبت إلى الإطار");
      
      // حفظ آخر URL مستخدم
      localStorage.setItem('lastAutoFillUrl', targetUrl);
    } catch (error) {
      console.error("خطأ في تنفيذ السكريبت:", error);
      throw error;
    }
  }, [bookmarkletCode, rawDataObject]);

  return {
    bookmarkletUrl,
    bookmarkletCode,
    rawDataObject,
    executeScript
  };
};
