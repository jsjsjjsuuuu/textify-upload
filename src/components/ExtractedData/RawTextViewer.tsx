
import { useState } from "react";

interface RawTextViewerProps {
  text: string;
}

const RawTextViewer = ({ text }: RawTextViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
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
          <span className="ms-2 text-xs text-gray-500">({text.length} حرف)</span>
        </summary>
        <div className="bg-gray-100 p-3 rounded-md mt-2 max-h-60 overflow-y-auto rtl-text">
          <pre className="whitespace-pre-wrap text-xs break-words leading-relaxed">
            {text}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default RawTextViewer;
