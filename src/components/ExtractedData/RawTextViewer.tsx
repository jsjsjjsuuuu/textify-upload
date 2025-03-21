
import { useState } from "react";

interface RawTextViewerProps {
  text: string;
}

const RawTextViewer = ({ text }: RawTextViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) {
    return (
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">لم يتم استخراج أي نص بعد</p>
      </div>
    );
  }
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // تنظيف النص للعرض بشكل أفضل
  const cleanText = text.replace(/```json[\s\S]*```/g, "").trim();
  const hasText = cleanText.length > 0;
  
  return (
    <div className="mt-4 pt-4 border-t">
      <details className="text-xs" open={isExpanded}>
        <summary 
          className="cursor-pointer font-medium mb-2 hover:text-blue-600 transition-colors flex items-center"
          onClick={(e) => {
            e.preventDefault(); // منع السلوك الافتراضي للتفاصيل
            toggleExpand();
          }}
        >
          <span>النص المستخرج الخام</span>
          <span className="ms-2 text-xs text-gray-500">
            ({hasText ? text.length : 0} حرف)
            {!hasText && " - لم يتم استخراج نص كامل"}
          </span>
        </summary>
        <div className="bg-gray-100 p-3 rounded-md mt-2 max-h-60 overflow-y-auto rtl-text">
          {hasText ? (
            <pre className="whitespace-pre-wrap text-xs break-words leading-relaxed">
              {cleanText}
            </pre>
          ) : (
            <div className="text-center p-4 text-gray-500">
              <p>لم يتم استخراج نص من الصورة</p>
              <p className="text-xs mt-2">قد تكون جودة الصورة منخفضة أو هناك مشكلة في الاتصال</p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
};

export default RawTextViewer;
