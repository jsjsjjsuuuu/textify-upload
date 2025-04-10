
import { useState } from "react";
interface RawTextViewerProps {
  text: string;
}
const RawTextViewer = ({
  text
}: RawTextViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) {
    return <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">لم يتم استخراج أي نص بعد</p>
      </div>;
  }
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // تنظيف النص للعرض بشكل أفضل
  const cleanText = text.replace(/```json[\s\S]*```/g, "").trim();
  const hasText = cleanText.length > 0;
  
  return (
    <div className="mt-4 pt-4 border-t" dir="rtl">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">النص الخام المستخرج:</h4>
        <button 
          onClick={toggleExpand} 
          className="text-xs text-blue-500 hover:underline"
        >
          {isExpanded ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      </div>
      
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-xs text-right overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-24'}`}>
        {hasText ? (
          <pre className="whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300" dir="rtl">
            {cleanText}
          </pre>
        ) : (
          <p className="text-gray-500 italic">لا يوجد نص خام مستخرج</p>
        )}
      </div>
    </div>
  );
};
export default RawTextViewer;
