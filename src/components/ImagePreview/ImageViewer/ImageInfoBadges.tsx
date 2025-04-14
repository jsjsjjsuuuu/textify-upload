
import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface ImageInfoBadgesProps {
  number?: number;
  date: Date;
  confidence?: number;
  extractionMethod?: 'ocr' | 'gemini';
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
    <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 z-10">
      {number && (
        <Badge variant="outline" className="bg-gray-900/80 text-white border-gray-700/50">
          #{number}
        </Badge>
      )}
      
      <Badge variant="outline" className="bg-gray-900/80 text-white border-gray-700/50">
        <Clock className="w-3 h-3 ml-1" />
        {formatDate(date)}
      </Badge>
      
      {confidence && (
        <Badge 
          variant="outline" 
          className={`border ${
            confidence > 80 ? 'bg-green-900/80 border-green-700/50' :
            confidence > 50 ? 'bg-yellow-900/80 border-yellow-700/50' :
            'bg-red-900/80 border-red-700/50'
          }`}
        >
          {confidence > 80 ? (
            <CheckCircle className="w-3 h-3 ml-1" />
          ) : confidence > 50 ? (
            <AlertTriangle className="w-3 h-3 ml-1" />
          ) : (
            <AlertTriangle className="w-3 h-3 ml-1" />
          )}
          {Math.round(confidence)}% دقة
        </Badge>
      )}
      
      {extractionMethod && (
        <Badge variant="outline" className="bg-blue-900/80 text-white border-blue-700/50">
          {extractionMethod === 'ocr' ? 'OCR' : 'Gemini AI'}
        </Badge>
      )}
    </div>
  );
};

export default ImageInfoBadges;
