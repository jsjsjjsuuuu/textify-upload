
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageData } from '@/types/ImageData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from "@/components/ui/card";
import { Database, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      
      <RecordsList 
        records={records}
        isLoading={isLoading}
        isError={isError}
      />
    </Card>
  );
};

export default RecentRecords;
