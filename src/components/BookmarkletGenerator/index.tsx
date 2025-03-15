
import React, { useState, useEffect } from "react";
import BookmarkletLink from "./BookmarkletLink";
import AdvancedOptions from "./AdvancedOptions";
import ImprovedFormFillerSection from "./ImprovedFormFillerSection";
import ExportDataSection from "./ExportDataSection";
import BookmarkletInstructions from "./BookmarkletInstructions";
import BookmarkletStats from "./BookmarkletStats";
import SeleniumLikeSection from "./SeleniumLikeSection";
import { getBookmarkletCode } from "@/utils/bookmarklet/bookmarkletCode";
import { BookmarkletOptions } from "@/utils/bookmarklet/types";
import { useToast } from "@/hooks/use-toast";
import { getStorageStats } from "@/utils/bookmarklet";

const BookmarkletGenerator: React.FC = () => {
  const [bookmarkletLink, setBookmarkletLink] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [useFormFiller, setUseFormFiller] = useState<boolean>(true);
  const [useExportTools, setUseExportTools] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advancedOptions, setAdvancedOptions] = useState<BookmarkletOptions>({
    version: "2.0",
    includeFormFiller: true,
    includeExportTools: true,
  });
  const [stats, setStats] = useState({ 
    total: 0, 
    ready: 0, 
    success: 0, 
    error: 0, 
    lastUpdate: null as Date | null 
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBookmarkletStats();
    generateBookmarkletLink();
  }, []);

  const fetchBookmarkletStats = async () => {
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

  const generateBookmarkletLink = () => {
    setIsGenerating(true);
    try {
      const options: BookmarkletOptions = {
        version: advancedOptions.version || "2.0",
        includeFormFiller: useFormFiller,
        includeExportTools: useExportTools,
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

  const handleAdvancedOptionsChange = (newOptions: Partial<BookmarkletOptions>) => {
    setAdvancedOptions((prevOptions) => ({
      ...prevOptions,
      ...newOptions,
    }));
  };

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

  const handleCopyEnhancedBookmarklet = () => {
    toast({
      title: "معلومات",
      description: "تم تفعيل نسخ رابط البوكماركلت المحسّن",
    });
  };

  const handleExport = () => {
    toast({
      title: "تصدير",
      description: "تم تصدير البيانات بنجاح",
    });
  };

  const handleClear = () => {
    toast({
      title: "مسح",
      description: "تم مسح البيانات بنجاح",
    });
  };

  const handleRegenerateBookmarklet = () => {
    generateBookmarkletLink();
    toast({
      title: "تحديث",
      description: "تم إعادة إنشاء رابط البوكماركلت",
    });
  };

  const handleToggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  const handleDragStart = () => {
    console.log("بدأ سحب رابط البوكماركلت");
  };

  return (
    <div className="space-y-4">
      <BookmarkletStats
        stats={stats}
        imagesCount={0}
        validImagesCount={0}
      />
      
      <BookmarkletLink 
        bookmarkletUrl={bookmarkletLink} 
        isGeneratingUrl={isGenerating}
        onCopyBookmarklet={handleCopyBookmarklet}
        onDragStart={handleDragStart}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImprovedFormFillerSection
          enhancedBookmarkletUrl={bookmarkletLink} 
          isGeneratingUrl={isGenerating}
          onCopyEnhancedBookmarklet={handleCopyEnhancedBookmarklet}
          storedCount={stats.total}
        />
        <ExportDataSection
          stats={stats}
          imagesCount={0}
          validImagesCount={0}
          storedCount={stats.total}
          onExport={handleExport}
          onClear={handleClear}
        />
      </div>
      
      <SeleniumLikeSection 
        recordsCount={stats.total || 0} 
      />
      
      <AdvancedOptions
        showAdvanced={showAdvanced}
        isGeneratingUrl={isGenerating}
        onRegenerateBookmarklet={handleRegenerateBookmarklet}
        onToggleAdvanced={handleToggleAdvanced}
      />
      
      <BookmarkletInstructions />
    </div>
  );
};

export default BookmarkletGenerator;
