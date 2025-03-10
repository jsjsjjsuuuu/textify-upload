
import { Badge } from "@/components/ui/badge";

interface ImageInfoBadgesProps {
  number?: number;
  date: Date;
  confidence?: number;
  extractionMethod?: "ocr" | "gemini";
  formatDate: (date: Date) => string;
}

const ImageInfoBadges = ({
  number,
  date,
  confidence,
  extractionMethod,
  formatDate
}: ImageInfoBadgesProps) => {
  // تقييم دقة الاستخراج
  const getAccuracyColor = (confidence: number = 0) => {
    if (confidence >= 90) return "bg-green-500";
    if (confidence >= 70) return "bg-emerald-500";
    if (confidence >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <>
      {number !== undefined && (
        <div className="absolute top-2 right-2 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
          صورة {number}
        </div>
      )}
      
      <div className="flex items-center justify-between w-full mt-4">
        <p className="text-xs text-muted-foreground">
          {formatDate(date)}
        </p>
        
        <div className="flex items-center gap-2">
          {extractionMethod && (
            <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
              {extractionMethod === "gemini" ? "Gemini AI" : "OCR"}
            </Badge>
          )}
          
          {confidence !== undefined && (
            <Badge className={`text-xs ${getAccuracyColor(confidence)} text-white`}>
              دقة الاستخراج: {Math.round(confidence)}%
            </Badge>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageInfoBadges;
