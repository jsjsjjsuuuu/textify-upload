interface ExtractedTextDisplayProps {
  text: string;
  confidence?: number;
}
const ExtractedTextDisplay = ({
  text,
  confidence
}: ExtractedTextDisplayProps) => {
  if (!text) return null;
  return <div className="col-span-2 mt-1">
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center">
          <span>عرض النص المستخرج كاملاً</span>
          {confidence && <span className="\u0642\u0645 \u0628\u0627\u0644\u063A\u0627\u0621\u0647\u0627 \n">
              دقة الاستخراج: {confidence}%
            </span>}
        </summary>
        <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-24 overflow-y-auto text-xs">
          {text}
        </div>
      </details>
    </div>;
};
export default ExtractedTextDisplay;