
import React from 'react';
import { ImageData } from "@/types/ImageData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateFormatter';
import { useNavigate } from 'react-router-dom';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";

interface RecordsListProps {
  records: ImageData[];
  isLoading: boolean;
  isError: boolean;
}

const RecordsList: React.FC<RecordsListProps> = ({ records, isLoading, isError }) => {
  const navigate = useNavigate();
  
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
      className="overflow-x-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">#</TableHead>
            <TableHead>الكود</TableHead>
            <TableHead>المرسل</TableHead>
            <TableHead className="text-center">الهاتف</TableHead>
            <TableHead>المحافظة</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead className="text-center">التاريخ</TableHead>
            <TableHead>الحالة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow 
              key={record.id} 
              className="cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => navigate(`/records?id=${record.id}`)}
            >
              <TableCell className="font-medium text-center">{index + 1}</TableCell>
              <TableCell className="font-semibold">{record.code || '—'}</TableCell>
              <TableCell>{record.senderName || '—'}</TableCell>
              <TableCell dir="ltr" className="text-center">{record.phoneNumber || '—'}</TableCell>
              <TableCell>{record.province || '—'}</TableCell>
              <TableCell>{record.price || '—'}</TableCell>
              <TableCell className="text-muted-foreground text-sm text-center">{formatDate(record.date)}</TableCell>
              <TableCell>
                {record.submitted && (
                  <Badge className="bg-green-100/20 text-green-600 border-green-200/30">
                    تم الإرسال
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
};

export default RecordsList;
