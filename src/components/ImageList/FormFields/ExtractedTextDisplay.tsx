
interface ExtractedTextDisplayProps {
  text: string;
  confidence?: number;
}

const ExtractedTextDisplay = ({ text, confidence }: ExtractedTextDisplayProps) => {
  if (!text) return null;
  
  return (
    <div className="col-span-2 mt-1">
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center">
          <span>عرض النص المستخرج كاملاً</span>
          {confidence && (
            <span className="mr-2 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px]">
              دقة الاستخراج: {confidence}%
            </span>
          )}
        </summary>
        <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-24 overflow-y-auto text-xs">
          {text}
        </div>
      </details>
    </div>
  );
};

export default ExtractedTextDisplay;
