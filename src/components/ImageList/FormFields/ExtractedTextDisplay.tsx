
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ExtractedTextDisplayProps {
  text: string;
  confidence?: number;
  onSaveToDatabase?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

const ExtractedTextDisplay = ({
  text,
  confidence,
  onSaveToDatabase,
  isSaving = false,
  isSaved = false
}: ExtractedTextDisplayProps) => {
  const { isAuthenticated } = useAuth();
  
  if (!text) return null;
  
  return (
    <div className="col-span-2 mt-1">
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center justify-between">
          <span>عرض النص المستخرج كاملاً</span>
          <div className="flex items-center gap-2">
            {confidence !== undefined && (
              <span className="bg-muted/50 px-1.5 py-0.5 rounded-md text-xs">
                {confidence}%
              </span>
            )}
            
            {isAuthenticated && onSaveToDatabase && !isSaved && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  onSaveToDatabase();
                }}
                disabled={isSaving || isSaved}
              >
                <Save className="h-3 w-3 ml-1" />
                {isSaving ? "جاري الحفظ..." : "حفظ في قاعدة البيانات"}
              </Button>
            )}
            
            {isAuthenticated && isSaved && (
              <span className="text-green-600 text-xs">تم الحفظ ✓</span>
            )}
          </div>
        </summary>
        <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-24 overflow-y-auto text-xs">
          {text}
        </div>
      </details>
    </div>
  );
};

export default ExtractedTextDisplay;
