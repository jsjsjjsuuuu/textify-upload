import React, { useState, useEffect } from "react";
import BookmarkletLink from "./BookmarkletLink";
import AdvancedOptions from "./AdvancedOptions";
import ImprovedFormFillerSection from "./ImprovedFormFillerSection";
import ExportDataSection from "./ExportDataSection";
import BookmarkletInstructions from "./BookmarkletInstructions";
import BookmarkletStats from "./BookmarkletStats";
import SeleniumLikeSection from "./SeleniumLikeSection"; // إضافة استيراد المكون الجديد
import { getBookmarkletCode } from "@/utils/bookmarklet/bookmarkletCode";
import { BookmarkletOptions } from "@/types/BookmarkletOptions";
import { useToast } from "@/hooks/use-toast";
import { getStorageStats } from "@/utils/bookmarklet";

const BookmarkletGenerator: React.FC = () => {
  const [bookmarkletLink, setBookmarkletLink] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [useFormFiller, setUseFormFiller] = useState<boolean>(true);
  const [useExportTools, setUseExportTools] = useState<boolean>(true);
  const [advancedOptions, setAdvancedOptions] = useState<BookmarkletOptions>({
    version: "2.0",
    includeFormFiller: true,
    includeExportTools: true,
  });
  const [stats, setStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchBookmarkletStats();
  }, []);

  const fetchBookmarkletStats = async () => {
    try {
      const storageStats = getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error("Failed to fetch bookmarklet stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookmarklet stats",
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
      console.error("Error generating bookmarklet link:", error);
      toast({
        title: "Error",
        description: "Failed to generate bookmarklet link",
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

  return (
    <div className="space-y-4">
      <BookmarkletStats
        stats={stats}
        onRefreshStats={fetchBookmarkletStats}
      />
      
      <BookmarkletLink 
        link={bookmarkletLink} 
        isGenerating={isGenerating}
        onGenerateLinkClick={generateBookmarkletLink} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImprovedFormFillerSection
          onUseFormFillerChange={setUseFormFiller}
          useFormFiller={useFormFiller}
        />
        <ExportDataSection
          onUseExportToolsChange={setUseExportTools}
          useExportTools={useExportTools}
        />
      </div>
      
      {/* إضافة قسم محاكاة السيلينيوم */}
      <SeleniumLikeSection 
        recordsCount={stats.total || 0} 
      />
      
      <AdvancedOptions
        onAdvancedOptionsChange={handleAdvancedOptionsChange}
        currentValues={advancedOptions}
      />
      
      <BookmarkletInstructions />
    </div>
  );
};

export default BookmarkletGenerator;
