
import { CalendarIcon, Hash, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImageInfoBadgesProps {
  number?: number | string;
  date: Date;
  confidence?: number;
  extractionMethod?: string;
  formatDate: (date: Date) => string;
}

const ImageInfoBadges = ({
  number,
  date,
  confidence,
  extractionMethod,
  formatDate
}: ImageInfoBadgesProps) => {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
      {number !== undefined && (
        <Badge variant="secondary" className="flex items-center gap-1 bg-white/80 backdrop-blur-sm">
          <Hash className="h-3 w-3" />
          {number}
        </Badge>
      )}
      
      <Badge variant="secondary" className="flex items-center gap-1 bg-white/80 backdrop-blur-sm">
        <CalendarIcon className="h-3 w-3" />
        {formatDate(date)}
      </Badge>
      
      {confidence !== undefined && (
        <Badge 
          variant="secondary" 
          className={`flex items-center gap-1 ${
            confidence > 80 
              ? 'bg-green-100 text-green-800' 
              : confidence > 50 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
          }`}
        >
          <Percent className="h-3 w-3" />
          {Math.round(confidence)}%
        </Badge>
      )}
      
      {extractionMethod && (
        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-800">
          {extractionMethod}
        </Badge>
      )}
    </div>
  );
};

export default ImageInfoBadges;
