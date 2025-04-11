
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ImageStatsProps {
  stats: {
    all: number;
    pending: number;
    processing: number;
    completed: number;
    incomplete: number;
    error: number;
  };
}

const ImageStats: React.FC<ImageStatsProps> = ({ stats }) => {
  return (
    <div className="flex gap-2 flex-wrap" dir="rtl">
      <Badge variant="outline" className="bg-slate-100">الكل {stats.all}</Badge>
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">قيد الانتظار {stats.pending}</Badge>
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مكتملة {stats.completed}</Badge>
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">أخطاء {stats.error}</Badge>
    </div>
  );
};

export default ImageStats;
