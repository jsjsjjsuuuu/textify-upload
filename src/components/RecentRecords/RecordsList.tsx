
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
      <CardContent className="text-center py-8 text-muted-foreground">
        حدث خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.
      </CardContent>
    );
  }

  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <CardContent className="space-y-4">
      {records.map((record) => (
        <RecordItem 
          key={record.id}
          record={record}
          formatDate={formatDate}
        />
      ))}
    </CardContent>
  );
};

export default RecordsList;
