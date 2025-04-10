
import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FetchRecordsOptions {
  recordsPerPage?: number;
}

export const useFetchRecords = (options: FetchRecordsOptions = {}) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ImageData[]>([]);
  const [selectedRecordType, setSelectedRecordType] = useState<'all' | 'mine' | 'others'>('all');
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const recordsPerPage = options.recordsPerPage || 10;

  const fetchRecords = useCallback(async (reset = false) => {
    if (!user) return;

    const newPage = reset ? 1 : page;
    const loadingState = reset ? setLoading : setIsLoadingMore;
    
    try {
      loadingState(true);
      
      let query = supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false })
        .range((newPage - 1) * recordsPerPage, newPage * recordsPerPage - 1);
      
      if (selectedRecordType === 'mine') {
        query = query.eq('user_id', user.id);
      } else if (selectedRecordType === 'others' && user) {
        query = query.neq('user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // تحويل البيانات إلى النوع المطلوب
      const formattedData = data.map((record: any) => ({
        ...record,
        date: new Date(record.created_at),
        id: record.id || record.image_id,
        status: record.status || "completed",
      })) as ImageData[];
      
      // التحقق مما إذا كانت هناك المزيد من السجلات
      const { count } = await supabase
        .from('images')
        .select('id', { count: 'exact' });
        
      setHasMoreRecords((count || 0) > newPage * recordsPerPage);
      
      if (reset) {
        setRecords(formattedData);
        setPage(1);
      } else {
        setRecords(prev => [...prev, ...formattedData]);
        setPage(newPage + 1);
      }
    } catch (error) {
      console.error('خطأ في جلب السجلات:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب السجلات",
        variant: "destructive",
      });
    } finally {
      loadingState(false);
    }
  }, [selectedRecordType, user, page, recordsPerPage, toast]);
  
  useEffect(() => {
    if (user) {
      fetchRecords(true);
    }
  }, [selectedRecordType, user, fetchRecords]);
  
  const handleRecordTypeChange = (value: string) => {
    setSelectedRecordType(value as 'all' | 'mine' | 'others');
  };
  
  const handleRefresh = () => {
    fetchRecords(true);
  };
  
  const handleLoadMore = () => {
    fetchRecords();
  };

  return {
    loading,
    records,
    selectedRecordType,
    hasMoreRecords,
    isLoadingMore,
    handleRecordTypeChange,
    handleRefresh,
    handleLoadMore,
    fetchRecords,
    user  // تصدير المستخدم لاستخدامه في المكون الرئيسي
  };
};
