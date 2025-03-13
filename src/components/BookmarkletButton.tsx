
import React from "react";

interface BookmarkletButtonProps {
  url: string;
  isMultiMode?: boolean;
  isGoogleMode?: boolean;
  imagesCount?: number;
}

const BookmarkletButton: React.FC<BookmarkletButtonProps> = ({ 
  url, 
  isMultiMode = false,
  isGoogleMode = false,
  imagesCount = 0 
}) => {
  // تحديد النص المناسب للزر
  let buttonText = 'ملء البيانات تلقائياً';
  
  if (isMultiMode) {
    buttonText = `ملء البيانات المتعددة (${imagesCount})`;
  } else if (isGoogleMode) {
    buttonText = 'ملء بيانات Google';
  }
  
  return (
    <div className="border border-border rounded-md p-4 bg-muted/20 text-center">
      <a 
        href={url} 
        className="inline-block bg-brand-green text-white py-2 px-4 rounded-md hover:bg-brand-green/90 transition-colors"
        onClick={(e) => e.preventDefault()}
        title="اسحب هذا الزر إلى شريط المفضلة"
        draggable="true"
      >
        {buttonText}
      </a>
      <p className="mt-2 text-sm text-muted-foreground">اسحب هذا الزر إلى شريط المفضلة في متصفحك</p>
      {isGoogleMode && (
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">*مصمم خصيصاً للعمل مع مستندات Google</p>
      )}
    </div>
  );
};

export default BookmarkletButton;
