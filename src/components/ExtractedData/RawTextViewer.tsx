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
  return <div className="mt-4 pt-4 border-t">
      
    </div>;
};
export default RawTextViewer;