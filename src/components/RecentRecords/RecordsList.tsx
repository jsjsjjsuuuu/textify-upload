
import React from 'react';
import { ImageData } from "@/types/ImageData";
import RecordItem from './RecordItem';
import { Button } from "@/components/ui/button";
import { ArrowDownWideNarrow, Loader2 } from "lucide-react";
import EmptyState from './EmptyState';

interface RecordsListProps {
  records: ImageData[];
  formatDate: (date: Date) => string;
  hasMoreRecords: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

const RecordsList = ({ 
  records, 
  formatDate, 
  hasMoreRecords, 
  isLoadingMore, 
  onLoadMore 
}: RecordsListProps) => {
  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="space-y-4 mt-4">
        {records.map((record) => (
          <RecordItem 
            key={record.id} 
            record={record} 
            formatDate={formatDate} 
          />
        ))}
      </div>
      
      {hasMoreRecords && (
        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownWideNarrow className="mr-2 h-4 w-4" />
            )}
            تحميل المزيد
          </Button>
        </div>
      )}
    </>
  );
};

export default RecordsList;
