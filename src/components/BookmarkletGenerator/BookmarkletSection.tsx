
import React from "react";
import BookmarkletInstructions from "./BookmarkletInstructions";
import BookmarkletLink from "./BookmarkletLink";
import AdvancedOptions from "./AdvancedOptions";

interface BookmarkletSectionProps {
  bookmarkletUrl: string;
  isGeneratingUrl: boolean;
  showAdvanced: boolean;
  onCopyBookmarklet: () => void;
  onRegenerateBookmarklet: () => void;
  onToggleAdvanced: () => void;
}

const BookmarkletSection: React.FC<BookmarkletSectionProps> = ({
  bookmarkletUrl,
  isGeneratingUrl,
  showAdvanced,
  onCopyBookmarklet,
  onRegenerateBookmarklet,
  onToggleAdvanced
}) => {
  // معالجة السحب والإفلات للبوكماركلت
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    // لا نحتاج لأي إجراء خاص هنا، المتصفح يتعامل مع السحب بشكل طبيعي
    console.log("بدء سحب رابط البوكماركلت");
  };
  
  return (
    <div className="space-y-4">
      <BookmarkletInstructions />
      
      <BookmarkletLink 
        bookmarkletUrl={bookmarkletUrl}
        isGeneratingUrl={isGeneratingUrl}
        onCopyBookmarklet={onCopyBookmarklet}
        onDragStart={handleDragStart}
      />
      
      <AdvancedOptions 
        showAdvanced={showAdvanced}
        isGeneratingUrl={isGeneratingUrl}
        onRegenerateBookmarklet={onRegenerateBookmarklet}
        onToggleAdvanced={onToggleAdvanced}
      />
    </div>
  );
};

export default BookmarkletSection;
