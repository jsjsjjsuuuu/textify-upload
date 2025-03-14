
import React from "react";
import { AlertTriangle } from "lucide-react";

const BookmarkletInstructions: React.FC = () => {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
        هام - تأكد من إتمام هذه الخطوات بالترتيب:
      </h3>
      <ol className="text-sm space-y-2 list-decimal list-inside text-amber-700 dark:text-amber-400">
        <li><strong>قم بتصدير البيانات أولاً</strong> في صفحة "تصدير البيانات"</li>
        <li><strong>اسحب</strong> الرابط أدناه إلى شريط الإشارات المرجعية/المفضلة في المتصفح</li>
        <li>انتقل إلى <strong>موقع شركة التوصيل</strong> وسجل الدخول</li>
        <li>انقر على <strong>رابط أداة نقل البيانات</strong> في شريط الإشارات المرجعية</li>
      </ol>
    </div>
  );
};

export default BookmarkletInstructions;
