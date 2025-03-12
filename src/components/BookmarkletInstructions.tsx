
import React from "react";

interface BookmarkletInstructionsProps {
  isMultiMode?: boolean;
}

const BookmarkletInstructions: React.FC<BookmarkletInstructionsProps> = ({ 
  isMultiMode = false 
}) => {
  return (
    <div className="text-sm mt-2 space-y-2">
      <h4 className="font-medium">كيفية الاستخدام:</h4>
      <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
        <li>اسحب الزر الأخضر أعلاه إلى شريط المفضلة في متصفحك</li>
        <li>انتقل إلى الموقع الذي تريد ملء البيانات فيه</li>
        <li>انقر على الزر في شريط المفضلة</li>
        {isMultiMode ? (
          <>
            <li>سيظهر شريط تحكم يمكنك من خلاله التنقل بين البيانات باستخدام أزرار "التالي" و"السابق"</li>
            <li>يمكنك سحب شريط التحكم وتحريكه في أي مكان على الصفحة</li>
          </>
        ) : (
          <li>سيتم ملء الحقول المتطابقة تلقائياً</li>
        )}
      </ol>
    </div>
  );
};

export default BookmarkletInstructions;
