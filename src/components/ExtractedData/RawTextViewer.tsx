
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
      {hasText && (
        <div className="space-y-2">
          <button 
            onClick={toggleExpand}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center"
          >
            <span className="text-right w-full">
              {isExpanded ? "إخفاء النص المستخرج" : "عرض النص المستخرج"}
            </span>
          </button>
          
          {isExpanded && (
            <div className="bg-muted/30 p-2 rounded-md rtl text-muted-foreground max-h-40 overflow-y-auto text-xs text-right">
              {cleanText.split('\n').map((line, i) => (
                <div key={i} dir="rtl">{line || <br />}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RawTextViewer;
