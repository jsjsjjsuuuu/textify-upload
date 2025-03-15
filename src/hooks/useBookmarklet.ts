
import { useState, useEffect } from 'react';
import { BookmarkletOptions } from '@/types/BookmarkletOptions';
import { getStorageStats, getFromLocalStorage } from '@/utils/bookmarklet';
import { getBookmarkletCode } from '@/utils/bookmarklet/bookmarkletCode';
import { BookmarkletItem, StorageStats } from '@/utils/bookmarklet/types';
import { useToast } from './use-toast';

/**
 * هوك مخصص للتعامل مع وظائف البوكماركلت
 */
export const useBookmarklet = () => {
  const [bookmarkletLink, setBookmarkletLink] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [useFormFiller, setUseFormFiller] = useState<boolean>(true);
  const [useExportTools, setUseExportTools] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advancedOptions, setAdvancedOptions] = useState<BookmarkletOptions>({
    version: "2.0",
    includeFormFiller: true,
    includeExportTools: true,
    includeSeleniumLike: false,
    debugMode: false,
    advancedOptions: {
      useAdvancedFieldDetection: true,
      refreshAfterFill: false
    }
  });
  
  const [stats, setStats] = useState<StorageStats>({ 
    total: 0, 
    ready: 0, 
    success: 0, 
    error: 0, 
    lastUpdate: null
  });
  
  const { toast } = useToast();
  
  // تحميل إحصائيات البوكماركلت عند التحميل الأولي
  useEffect(() => {
    fetchBookmarkletStats();
    generateBookmarkletLink();
  }, []);
  
  // تحديث رابط البوكماركلت عند تغيير الخيارات
  useEffect(() => {
    generateBookmarkletLink();
  }, [useFormFiller, useExportTools, advancedOptions]);
  
  /**
   * جلب إحصائيات البوكماركلت المخزنة
   */
  const fetchBookmarkletStats = () => {
    try {
      const storageStats = getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error("خطأ في جلب إحصائيات البوكماركلت:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب إحصائيات البوكماركلت",
        variant: "destructive",
      });
    }
  };
  
  /**
   * إنشاء رابط البوكماركلت
   */
  const generateBookmarkletLink = () => {
    setIsGenerating(true);
    try {
      const options: BookmarkletOptions = {
        version: advancedOptions.version || "2.0",
        includeFormFiller: useFormFiller,
        includeExportTools: useExportTools,
        includeSeleniumLike: advancedOptions.includeSeleniumLike,
        debugMode: advancedOptions.debugMode,
        advancedOptions: advancedOptions.advancedOptions
      };
      
      const code = getBookmarkletCode(options);
      const encodedCode = encodeURIComponent(code);
      const link = `javascript:${encodedCode}`;
      setBookmarkletLink(link);
    } catch (error) {
      console.error("خطأ في إنشاء رابط البوكماركلت:", error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء رابط البوكماركلت",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * معالجة تغيير الخيارات المتقدمة
   */
  const handleAdvancedOptionsChange = (newOptions: Partial<BookmarkletOptions>) => {
    setAdvancedOptions((prevOptions) => ({
      ...prevOptions,
      ...newOptions,
    }));
  };
  
  /**
   * نسخ رابط البوكماركلت
   */
  const handleCopyBookmarklet = () => {
    if (navigator.clipboard && bookmarkletLink) {
      navigator.clipboard.writeText(bookmarkletLink)
        .then(() => {
          toast({
            title: "تم النسخ",
            description: "تم نسخ رابط البوكماركلت بنجاح",
          });
        })
        .catch((err) => {
          console.error("فشل نسخ الرابط:", err);
          toast({
            title: "خطأ",
            description: "فشل في نسخ الرابط",
            variant: "destructive",
          });
        });
    }
  };
  
  /**
   * تصدير بيانات البوكماركلت
   */
  const handleExport = () => {
    try {
      const bookmarkletItems = getFromLocalStorage();
      if (!bookmarkletItems || bookmarkletItems.length === 0) {
        toast({
          title: "معلومات",
          description: "لا توجد بيانات للتصدير",
        });
        return;
      }
      
      // إنشاء ملف للتصدير
      const exportData = {
        version: "2.0",
        exportDate: new Date().toISOString(),
        items: bookmarkletItems
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // إنشاء رابط تنزيل وتنزيل الملف
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarklet_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تصدير",
        description: "تم تصدير البيانات بنجاح",
      });
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      toast({
        title: "خطأ",
        description: "فشل في تصدير البيانات",
        variant: "destructive",
      });
    }
  };
  
  /**
   * مسح بيانات البوكماركلت
   */
  const handleClear = () => {
    try {
      localStorage.removeItem('bookmarklet_data_v1');
      setStats({ 
        total: 0, 
        ready: 0, 
        success: 0, 
        error: 0, 
        lastUpdate: null
      });
      
      toast({
        title: "مسح",
        description: "تم مسح البيانات بنجاح",
      });
    } catch (error) {
      console.error("خطأ في مسح البيانات:", error);
      toast({
        title: "خطأ",
        description: "فشل في مسح البيانات",
        variant: "destructive",
      });
    }
  };
  
  /**
   * إعادة إنشاء رابط البوكماركلت
   */
  const handleRegenerateBookmarklet = () => {
    generateBookmarkletLink();
    toast({
      title: "تحديث",
      description: "تم إعادة إنشاء رابط البوكماركلت",
    });
  };
  
  return {
    bookmarkletLink,
    isGenerating,
    useFormFiller,
    setUseFormFiller,
    useExportTools,
    setUseExportTools,
    showAdvanced,
    setShowAdvanced,
    advancedOptions,
    stats,
    handleAdvancedOptionsChange,
    handleCopyBookmarklet,
    handleExport,
    handleClear,
    handleRegenerateBookmarklet,
    fetchBookmarkletStats
  };
};

export default useBookmarklet;
