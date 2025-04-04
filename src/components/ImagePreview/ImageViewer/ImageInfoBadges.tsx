
import React from 'react';

interface ImageInfoBadgesProps {
  number?: number;
  date: Date;
  confidence?: number;
  extractionMethod?: string;
  formatDate: (date: Date) => string;
}

const ImageInfoBadges: React.FC<ImageInfoBadgesProps> = ({
  number,
  date,
  confidence,
  extractionMethod,
  formatDate
}) => {
  if (!date && !number && !confidence && !extractionMethod) return null;
  
  return (
    <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[70%]">
      {number && (
        <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
          رقم: {number}
        </div>
      )}
      
      {date && (
        <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-800">
          {formatDate(date)}
        </div>
      )}
      
      {confidence && (
        <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 shadow-sm border border-purple-200 dark:border-purple-800">
          الدقة: {confidence}%
        </div>
      )}
      
      {extractionMethod && (
        <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800">
          {extractionMethod === 'gemini' ? 'Gemini AI' : 'OCR'}
        </div>
      )}
    </div>
  );
};

export default ImageInfoBadges;
