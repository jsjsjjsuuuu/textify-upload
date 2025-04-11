
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface StatusBadgesProps {
  counts: {
    all: number;
    pending: number;
    completed: number;
    incomplete: number;
    error: number;
    processing: number;
  };
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ 
  counts, 
  activeFilter,
  onFilterChange
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4" dir="rtl">
      <Badge 
        variant={activeFilter === "all" ? "default" : "outline"} 
        className="cursor-pointer border-2 text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
        onClick={() => onFilterChange("all")}
      >
        الكل <span className="inline-flex items-center justify-center bg-white text-gray-800 rounded-full w-5 h-5 text-xs mr-1">{counts.all}</span>
      </Badge>
      <Badge 
        variant={activeFilter === "pending" ? "default" : "outline"} 
        className="cursor-pointer border-2 text-sm px-3 py-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
        onClick={() => onFilterChange("pending")}
      >
        قيد الانتظار <span className="inline-flex items-center justify-center bg-white text-amber-700 rounded-full w-5 h-5 text-xs mr-1">{counts.pending}</span>
      </Badge>
      <Badge 
        variant={activeFilter === "completed" ? "default" : "outline"} 
        className="cursor-pointer border-2 text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        onClick={() => onFilterChange("completed")}
      >
        مكتملة <span className="inline-flex items-center justify-center bg-white text-green-700 rounded-full w-5 h-5 text-xs mr-1">{counts.completed}</span>
      </Badge>
      <Badge 
        variant={activeFilter === "error" ? "default" : "outline"} 
        className="cursor-pointer border-2 text-sm px-3 py-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
        onClick={() => onFilterChange("error")}
      >
        أخطاء <span className="inline-flex items-center justify-center bg-white text-red-700 rounded-full w-5 h-5 text-xs mr-1">{counts.error}</span>
      </Badge>
      <Badge 
        variant={activeFilter === "processing" ? "default" : "outline"} 
        className="cursor-pointer border-2 text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        onClick={() => onFilterChange("processing")}
      >
        قيد المعالجة <span className="inline-flex items-center justify-center bg-white text-blue-700 rounded-full w-5 h-5 text-xs mr-1">{counts.processing}</span>
      </Badge>
    </div>
  );
};

export default StatusBadges;
