
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
import { Database, ExternalLink, Loader } from 'lucide-react';

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
          .limit(10);

        if (error) {
          console.error("خطأ في جلب السجلات الأخيرة:", error);
          throw error;
        }

        if (data) {
          // تحويل البيانات المسترجعة إلى كائنات ImageData
          const formattedRecords = data.map((record, index) => {
            const dummyFile = new File([], record.file_name || "image.jpg", { 
              type: "image/jpeg" 
            });
            
            // التأكد من أن status يتوافق مع النوع المحدد
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
      <Card className="glass-card border-none overflow-hidden shadow-xl">
        <div className="glassmorphism-header p-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-xl font-bold text-white">آخر السجلات</h2>
          <Button variant="ghost" size="sm" disabled className="text-white/70 hover:bg-white/10">
            <Loader className="w-4 h-4 ml-1 animate-spin" /> جاري التحميل...
          </Button>
        </div>
        <div className="space-y-4 p-6 backdrop-blur-md bg-black/30">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-6 w-3/4 bg-white/10" />
              <Skeleton className="h-6 w-1/5 bg-white/10" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="glass-card border-none overflow-hidden shadow-xl">
        <div className="glassmorphism-header p-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-xl font-bold text-white">آخر السجلات</h2>
          <Button variant="ghost" size="sm" onClick={handleViewAllClick} className="text-white hover:bg-white/20">
            <ExternalLink className="w-4 h-4 ml-1" /> عرض الكل
          </Button>
        </div>
        <div className="text-center p-12 text-white/70 backdrop-blur-md bg-black/30">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">لا توجد سجلات حتى الآن</p>
          <p className="text-sm mt-2 text-white/50">ستظهر هنا السجلات بمجرد إضافتها</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-none overflow-hidden shadow-xl">
      <div className="glassmorphism-header p-4 flex justify-between items-center border-b border-white/10">
        <h2 className="text-xl font-bold text-white">آخر السجلات</h2>
        <Button variant="ghost" size="sm" onClick={handleViewAllClick} className="text-white hover:bg-white/20">
          <ExternalLink className="w-4 h-4 ml-1" /> عرض الكل
        </Button>
      </div>
      <div className="overflow-x-auto backdrop-blur-md bg-black/30">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="glassmorphism-header-row">
              <TableHead className="text-white/90 font-bold text-right">#</TableHead>
              <TableHead className="text-white/90 font-bold text-right">التاريخ</TableHead>
              <TableHead className="text-white/90 font-bold text-right">المرسل</TableHead>
              <TableHead className="text-white/90 font-bold text-right">الهاتف</TableHead>
              <TableHead className="text-white/90 font-bold text-right">المبلغ</TableHead>
              <TableHead className="text-white/90 font-bold text-right">الشركة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow 
                key={record.id} 
                className="glassmorphism-table-row cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => navigate(`/records?id=${record.id}`)}
              >
                <TableCell className="font-medium text-white text-right">{record.number}</TableCell>
                <TableCell className="text-white/90 text-right">{formatDate(record.date)}</TableCell>
                <TableCell className="text-white/90 text-right">{record.senderName || '—'}</TableCell>
                <TableCell className="text-white/90 text-right">{record.phoneNumber || '—'}</TableCell>
                <TableCell className="text-white/90 text-right">{record.price || '—'}</TableCell>
                <TableCell className="text-white/90 text-right">{record.companyName || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default RecentRecords;
