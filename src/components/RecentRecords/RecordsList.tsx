
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { formatDate } from "@/utils/dateFormatter";
import RecordItem from './RecordItem';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface RecordsListProps {
  records: ImageData[];
  isLoading: boolean;
  isError: boolean;
}

const RecordsList: React.FC<RecordsListProps> = ({ records, isLoading, isError }) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-slate-400 bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50">
        حدث خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <RecordItem 
          key={record.id}
          record={record}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
};

export default RecordsList;
