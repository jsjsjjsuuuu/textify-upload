
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageData } from '@/types/ImageData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/dateFormatter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from "@/components/ui/card";
import { Database, ExternalLink, ListFilter } from 'lucide-react';
import RecordsList from './RecentRecords/RecordsList';

const RecentRecords: React.FC = () => {
  const [records, setRecords] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchRecentRecords = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', user.id)
          .eq('submitted', true)  // عرض السجلات المرسلة فقط
          .order('created_at', { ascending: false })
          .limit(10);  // تقليل عدد السجلات لتحسين الأداء

        if (error) {
          console.error("خطأ في جلب السجلات الأخيرة:", error);
          setIsError(true);
          throw error;
        }

        if (data) {
          const formattedRecords = data.map((record, index) => {
            const dummyFile = new File([], record.file_name || "image.jpg", { 
              type: "image/jpeg" 
            });
            
            let status: "pending" | "processing" | "completed" | "error" = "completed";
            if (record.status === "pending") status = "pending";
            else if (record.status === "processing") status = "processing";
            else if (record.status === "error") status = "error";
            
            return {
              id: record.id,
              file: dummyFile,
              previewUrl: record.preview_url,
              extractedText: record.extracted_text || "",
              code: record.code || "",
              senderName: record.sender_name || "",
              phoneNumber: record.phone_number || "",
              province: record.province || "",
              price: record.price || "",
              companyName: record.company_name || "",
              date: new Date(record.created_at),
              status: status,
              submitted: record.submitted || false,
              user_id: record.user_id,
              storage_path: record.storage_path,
              batch_id: record.batch_id,
              number: index + 1
            } as ImageData;
          });
          
          setRecords(formattedRecords);
        }
      } catch (error) {
        console.error("خطأ في جلب السجلات الأخيرة:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentRecords();
  }, [user]);

  const handleViewAllClick = () => {
    navigate('/records');
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="h-5 w-5 opacity-70" />
          آخر السجلات المرسلة
        </h2>
        <Button variant="ghost" size="sm" onClick={handleViewAllClick}>
          <ExternalLink className="w-4 h-4 ml-1" /> عرض الكل
        </Button>
      </div>
      
      {isLoading && (
        <div className="p-4">
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/5" />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isLoading && !isError && records.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>لا توجد سجلات مرسلة حتى الآن</p>
        </div>
      )}
      
      {!isLoading && isError && (
        <div className="text-center p-8 text-destructive">
          <p>حدث خطأ في جلب السجلات. يرجى المحاولة مرة أخرى.</p>
        </div>
      )}
      
      {!isLoading && !isError && records.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>المرسل</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>المحافظة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead className="w-[120px] text-center">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow 
                  key={record.id} 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => navigate(`/records?id=${record.id}`)}
                >
                  <TableCell className="font-medium text-center">{record.number}</TableCell>
                  <TableCell className="font-semibold">{record.code || '—'}</TableCell>
                  <TableCell>{record.senderName || '—'}</TableCell>
                  <TableCell dir="ltr" className="text-center">{record.phoneNumber || '—'}</TableCell>
                  <TableCell>{record.province || '—'}</TableCell>
                  <TableCell>{record.price || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm text-center">{formatDate(record.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};

export default RecentRecords;
