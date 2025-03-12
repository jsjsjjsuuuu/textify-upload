
import React from "react";

interface BookmarkletButtonProps {
  url: string;
  isMultiMode?: boolean;
  imagesCount?: number;
}

const BookmarkletButton: React.FC<BookmarkletButtonProps> = ({ 
  url, 
  isMultiMode = false, 
  imagesCount = 0 
}) => {
  return (
    <div className="border border-border rounded-md p-4 bg-muted/20 text-center">
      <a 
        href={url} 
        className="inline-block bg-brand-green text-white py-2 px-4 rounded-md hover:bg-brand-green/90 transition-colors"
        onClick={(e) => e.preventDefault()}
        title="اسحب هذا الزر إلى شريط المفضلة"
      >
        {isMultiMode ? `ملء البيانات المتعددة (${imagesCount})` : 'ملء البيانات تلقائياً'}
      </a>
      <p className="mt-2 text-sm text-muted-foreground">اسحب هذا الزر إلى شريط المفضلة في متصفحك</p>
    </div>
  );
};

export default BookmarkletButton;
