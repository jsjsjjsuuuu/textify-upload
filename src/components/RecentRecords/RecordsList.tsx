
import React from 'react';
import { ImageData } from "@/types/ImageData";
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
      <div className="glass-morphism text-center py-8 text-slate-400">
        حدث خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <RecordItem 
          key={record.id}
          record={record}
        />
      ))}
    </div>
  );
};

export default RecordsList;
