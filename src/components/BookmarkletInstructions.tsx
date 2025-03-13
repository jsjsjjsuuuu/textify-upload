
import React from "react";

interface BookmarkletInstructionsProps {
  isMultiMode?: boolean;
  isGoogleUrl?: boolean;
}

const BookmarkletInstructions: React.FC<BookmarkletInstructionsProps> = ({ 
  isMultiMode = false,
  isGoogleUrl = false
}) => {
  return (
    <div className="text-sm mt-2 space-y-2">
      <h4 className="font-medium">كيفية الاستخدام:</h4>
      <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
        <li>اسحب الزر الأخضر أعلاه إلى شريط المفضلة في متصفحك</li>
        <li>انتقل إلى الموقع الذي تريد ملء البيانات فيه</li>
        <li>انقر على الزر في شريط المفضلة</li>
        {isGoogleUrl ? (
          <li>بالنسبة لمواقع Google، قد تحتاج إلى تحديد حقول الإدخال يدوياً بعد النقر على الزر</li>
        ) : isMultiMode ? (
          <>
            <li>سيظهر شريط تحكم يمكنك من خلاله التنقل بين البيانات باستخدام أزرار "التالي" و"السابق"</li>
            <li>يمكنك سحب شريط التحكم وتحريكه في أي مكان على الصفحة</li>
          </>
        ) : (
          <li>سيتم ملء الحقول المتطابقة تلقائياً</li>
        )}
      </ol>
      
      {isGoogleUrl && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">نصائح خاصة لمواقع Google:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>استخدم هذا الـ bookmarklet عندما تكون صفحة Google مفتوحة في المتصفح</li>
            <li>قد لا تعمل جميع الحقول تلقائياً نظراً لطبيعة واجهة Google</li>
            <li>البيانات سيتم نسخها إلى الحافظة أيضاً ليمكنك لصقها يدوياً إذا لزم الأمر</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookmarkletInstructions;
