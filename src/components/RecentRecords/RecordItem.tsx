
import React from 'react';
import { Button } from "@/components/ui/button";
import { ImageData } from "@/types/ImageData";
import { Eye } from "lucide-react";

interface RecordItemProps {
  record: ImageData;
  formatDate: (date: Date) => string;
}

const RecordItem = ({ record, formatDate }: RecordItemProps) => {
  return (
    <div 
      className="backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all transform hover:scale-[1.01] hover:shadow-lg"
    >
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h4 className="font-medium text-white">
            {record.code || 'بدون كود'} - {record.senderName || 'بدون اسم مرسل'}
          </h4>
          <div className="text-sm text-white/70">
            {record.phoneNumber && `${record.phoneNumber} • `}
            {record.province && `${record.province} • `}
            {record.date && formatDate(record.date)}
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center">
          <Button 
            variant="outline" 
            className="text-xs h-8 bg-white/10 hover:bg-white/20 text-white border-white/20"
            asChild
          >
            <a href={`/records?id=${record.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              تفاصيل
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecordItem;
