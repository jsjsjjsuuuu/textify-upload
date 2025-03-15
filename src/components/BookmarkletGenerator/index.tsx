
import React from "react";
import BookmarkletLink from "./BookmarkletLink";
import AdvancedOptions from "./AdvancedOptions";
import ImprovedFormFillerSection from "./ImprovedFormFillerSection";
import ExportDataSection from "./ExportDataSection";
import BookmarkletInstructions from "./BookmarkletInstructions";
import BookmarkletStats from "./BookmarkletStats";
import SeleniumLikeSection from "./SeleniumLikeSection";
import useBookmarklet from "@/hooks/useBookmarklet";

const BookmarkletGenerator: React.FC = () => {
  const {
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
    handleRegenerateBookmarklet
  } = useBookmarklet();

  // معالج سحب البوكماركلت
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    console.log("بدأ سحب رابط البوكماركلت");
  };

  // معالج نسخ البوكماركلت المحسن
  const handleCopyEnhancedBookmarklet = () => {
    if (navigator.clipboard && bookmarkletLink) {
      navigator.clipboard.writeText(bookmarkletLink)
        .then(() => {
          console.log("تم نسخ رابط البوكماركلت المحسن بنجاح");
        })
        .catch((err) => {
          console.error("فشل نسخ الرابط المحسن:", err);
        });
    }
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
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />
      
      <BookmarkletInstructions />
    </div>
  );
};

export default BookmarkletGenerator;
