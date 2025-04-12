
import React from 'react';
import { Button } from "@/components/ui/button";
import { ImageData } from "@/types/ImageData";

interface RecordItemProps {
  record: ImageData;
  formatDate: (date: Date) => string;
}

const RecordItem = ({ record, formatDate }: RecordItemProps) => {
  return (
    <div 
      className="p-4 bg-muted/40 rounded-lg flex flex-col md:flex-row justify-between gap-4"
    >
      <div>
        <h4 className="font-medium">
          {record.code || 'بدون كود'} - {record.senderName || 'بدون اسم مرسل'}
        </h4>
        <div className="text-sm text-muted-foreground">
          {record.phoneNumber && `${record.phoneNumber} • `}
          {record.province && `${record.province} • `}
          {record.date && formatDate(record.date)}
        </div>
      </div>
      <div className="flex items-center gap-2 self-end md:self-center">
        <Button 
          variant="outline" 
          className="text-xs h-8"
          asChild
        >
          <a href={`/automation/${record.id}`}>
            تفاصيل
          </a>
        </Button>
      </div>
    </div>
  );
};

export default RecordItem;
