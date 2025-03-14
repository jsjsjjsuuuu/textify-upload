
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { 
  getStoredItemsCount, 
  clearStoredItems, 
  generateBookmarkletCode, 
  saveToLocalStorage, 
  getStorageStats 
} from "@/utils/bookmarkletService";

export const useBookmarklet = (images: ImageData[]) => {
  const { toast } = useToast();
  const [storedCount, setStoredCount] = useState(0);
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    success: 0,
    error: 0,
    lastUpdate: null as Date | null
  });

  // تحديث عدد العناصر المخزنة والكود عند التحميل
  useEffect(() => {
    console.log("useBookmarklet: تحميل البيانات الأولية");
    updateStoredCount();
    generateBookmarkletUrlWithDelay();
    updateStats();
  }, []); 
  
  // تحديث البيانات عند تغيير الصور
  useEffect(() => {
    console.log("تحديث إحصائيات البوكماركلت بعد تغيير الصور");
    updateStats();
  }, [images]);

  // توليد رابط البوكماركلت مع تأخير
  const generateBookmarkletUrlWithDelay = useCallback(() => {
    setIsGeneratingUrl(true);
    setTimeout(() => {
      try {
        const url = generateBookmarkletCode();
        setBookmarkletUrl(url);
        console.log("تم إنشاء رابط البوكماركلت بطول:", url.length);
      } catch (error) {
        console.error("خطأ في إنشاء رابط البوكماركلت:", error);
        toast({
          title: "خطأ في إنشاء رابط الأداة",
          description: "حدث خطأ أثناء توليد رابط البوكماركلت. حاول مرة أخرى.",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingUrl(false);
      }
    }, 500);
  }, [toast]);

  // تحديث عدد العناصر المخزنة
  const updateStoredCount = useCallback(() => {
    const count = getStoredItemsCount();
    console.log("تحديث عدد العناصر المخزنة:", count);
    setStoredCount(count);
  }, []);
  
  // تحديث إحصائيات التخزين
  const updateStats = useCallback(() => {
    const currentStats = getStorageStats();
    console.log("تحديث إحصائيات التخزين:", currentStats);
    
    // تأكد من أن lastUpdate هو Date أو null
    setStats({
      total: currentStats.total,
      ready: currentStats.ready,
      success: currentStats.success,
      error: currentStats.error,
      lastUpdate: currentStats.lastUpdate ? new Date(currentStats.lastUpdate) : null
    });
  }, []);

  // تصدير البيانات إلى localStorage
  const handleExport = useCallback(() => {
    console.log("تصدير البيانات:", images.length, "صورة");
    
    // تصفية الصور للتأكد من وجود البيانات الأساسية
    const validImages = images.filter(img => img.code && img.senderName && img.phoneNumber);
    console.log("عدد الصور الصالحة:", validImages.length);
    
    if (validImages.length === 0) {
      toast({
        title: "لا توجد بيانات كاملة",
        description: "تأكد من إكمال الحقول الأساسية (الكود، الاسم، رقم الهاتف) لصورة واحدة على الأقل",
        variant: "destructive"
      });
      return;
    }
    
    const count = saveToLocalStorage(validImages);
    updateStoredCount();
    updateStats();
    
    if (count > 0) {
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: `تم تصدير ${count} عنصر إلى ذاكرة المتصفح`,
        variant: "default"
      });
    } else {
      toast({
        title: "تعذر تصدير البيانات",
        description: "تأكد من وجود بيانات كاملة (الكود، الاسم، رقم الهاتف)",
        variant: "destructive"
      });
    }
  }, [images, toast, updateStoredCount, updateStats]);

  // مسح البيانات المخزنة
  const handleClear = useCallback(() => {
    clearStoredItems();
    updateStoredCount();
    updateStats();
    toast({
      title: "تم مسح البيانات",
      description: "تم مسح جميع البيانات المخزنة من ذاكرة المتصفح",
      variant: "default"
    });
  }, [toast, updateStoredCount, updateStats]);

  // نسخ رابط Bookmarklet
  const handleCopyBookmarklet = useCallback(() => {
    if (!bookmarkletUrl) {
      toast({
        title: "الرابط غير جاهز",
        description: "جاري إنشاء الرابط، انتظر لحظة من فضلك",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(bookmarkletUrl).then(() => {
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط Bookmarklet إلى الحافظة",
        variant: "default"
      });
    });
  }, [bookmarkletUrl, toast]);
  
  // إعادة إنشاء كود Bookmarklet
  const handleRegenerateBookmarklet = useCallback(() => {
    try {
      setIsGeneratingUrl(true);
      const newUrl = generateBookmarkletCode();
      setBookmarkletUrl(newUrl);
      setIsGeneratingUrl(false);
      
      toast({
        title: "تم إعادة إنشاء الرابط",
        description: "تم تحديث رمز Bookmarklet بأحدث التغييرات",
        variant: "default"
      });
    } catch (error) {
      console.error("خطأ في إعادة إنشاء رابط البوكماركلت:", error);
      setIsGeneratingUrl(false);
      
      toast({
        title: "خطأ في إعادة إنشاء الرابط",
        description: "حدث خطأ أثناء توليد رابط البوكماركلت. حاول مرة أخرى.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // تغيير حالة إظهار الخيارات المتقدمة
  const toggleAdvancedOptions = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  return {
    storedCount,
    bookmarkletUrl,
    isGeneratingUrl,
    showAdvanced,
    stats,
    handleExport,
    handleClear,
    handleCopyBookmarklet,
    handleRegenerateBookmarklet,
    toggleAdvancedOptions
  };
};
