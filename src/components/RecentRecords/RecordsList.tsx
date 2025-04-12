
import React from 'react';
import { ImageData } from "@/types/ImageData";
import RecordItem from './RecordItem';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { motion } from 'framer-motion';

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          حدث خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.
        </motion.div>
      </div>
    );
  }

  if (records.length === 0) {
    return <EmptyState />;
  }

  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {records.map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <RecordItem record={record} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default RecordsList;
