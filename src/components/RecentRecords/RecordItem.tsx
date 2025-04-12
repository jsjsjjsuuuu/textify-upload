
import React from 'react';
import { CheckCircle } from "lucide-react";
import { ImageData } from "@/types/ImageData";

interface RecordItemProps {
  record: ImageData;
  formatDate: (date: Date) => string;
}

const RecordItem = ({ record, formatDate }: RecordItemProps) => {
  return (
    <div className="task-card flex flex-row justify-between items-center p-4">
      <div className="flex items-center">
        <div className="bg-teal-700/30 text-teal-400 rounded-md px-4 py-1 text-sm mr-4">
          مكتمل
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div className="text-white font-semibold">
          مهمة #{record.id.substring(0, 4)}
        </div>
        <div className="text-slate-400 text-sm">
          تم الانتهاء بتاريخ {formatDate(record.date)}
        </div>
      </div>

      <div className="bg-teal-700/30 rounded-xl p-2">
        <CheckCircle className="text-teal-500" size={24} />
      </div>
    </div>
  );
};

export default RecordItem;
