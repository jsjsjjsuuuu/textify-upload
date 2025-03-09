
interface RawTextViewerProps {
  text: string;
}

const RawTextViewer = ({ text }: RawTextViewerProps) => {
  if (!text) return null;
  
  return (
    <div className="mt-4 pt-4 border-t">
      <details className="text-xs">
        <summary className="cursor-pointer font-medium mb-2">النص المستخرج الخام</summary>
        <div className="bg-gray-100 p-3 rounded-md mt-2 max-h-40 overflow-y-auto rtl-text">
          <pre className="whitespace-pre-wrap text-xs">
            {text}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default RawTextViewer;
