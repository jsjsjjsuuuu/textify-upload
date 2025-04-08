
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
import { Database, ExternalLink } from 'lucide-react';

const RecentRecords: React.FC = () => {
  const [records, setRecords] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
          .order('created_at', { ascending: false })
          .limit(15);

        if (error) {
          console.error("خطأ في جلب السجلات الأخيرة:", error);
          throw error;
        }

        if (data) {
          // تحويل البيانات المسترجعة إلى كائنات ImageData
          const formattedRecords: ImageData[] = data.map((record, index) => {
            const dummyFile = new File([], record.file_name || "image.jpg", { 
              type: "image/jpeg" 
            });
            
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
              status: record.status || "completed",
              submitted: record.submitted || false,
              user_id: record.user_id,
              storage_path: record.storage_path,
              batch_id: record.batch_id,
              number: index + 1
            };
          });
          
          setRecords(formattedRecords);
        }
      } catch (error) {
        console.error("خطأ في جلب السجلات الأخيرة:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentRecords();
  }, [user]);

  const handleViewAllClick = () => {
    navigate('/records');
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">آخر السجلات</h2>
          <Button variant="ghost" size="sm" disabled>
            <ExternalLink className="w-4 h-4 ml-1" /> عرض الكل
          </Button>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/5" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">آخر السجلات</h2>
          <Button variant="ghost" size="sm" onClick={handleViewAllClick}>
            <ExternalLink className="w-4 h-4 ml-1" /> عرض الكل
          </Button>
        </div>
        <div className="text-center p-8 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>لا توجد سجلات حتى الآن</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-bold">آخر السجلات</h2>
        <Button variant="ghost" size="sm" onClick={handleViewAllClick}>
          <ExternalLink className="w-4 h-4 ml-1" /> عرض الكل
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>المرسل</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>الشركة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow 
                key={record.id} 
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => navigate(`/records?id=${record.id}`)}
              >
                <TableCell className="font-medium">{record.number}</TableCell>
                <TableCell>{formatDate(record.date)}</TableCell>
                <TableCell>{record.senderName || '—'}</TableCell>
                <TableCell>{record.phoneNumber || '—'}</TableCell>
                <TableCell>{record.price || '—'}</TableCell>
                <TableCell>{record.companyName || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default RecentRecords;
