import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageData } from "@/types/ImageData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownWideNarrow, FileText, User, Users, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImageProcessing } from '@/hooks/useImageProcessing';
import TabBar from './TabBar';

const RecentRecords = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ImageData[]>([]);
  const [selectedRecordType, setSelectedRecordType] = useState<'all' | 'mine' | 'others'>('all');
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { handleSubmitToApi, formatDate } = useImageProcessing();

  const recordsPerPage = 10;

  const fetchRecords = async (reset = false) => {
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
  };
  
  const handleRecordTypeChange = (value: string) => {
    setSelectedRecordType(value as 'all' | 'mine' | 'others');
  };
  
  useEffect(() => {
    if (user) {
      fetchRecords(true);
    }
  }, [selectedRecordType, user]);
  
  const handleRefresh = () => {
    fetchRecords(true);
  };
  
  const handleLoadMore = () => {
    fetchRecords();
  };
  
  // إنشاء مصفوفة علامات التبويب
  const tabs = [
    {
      id: "all",
      label: "الكل",
      icon: <FileText className="w-4 h-4 opacity-70" />,
      count: records.length
    },
    {
      id: "mine",
      label: "سجلاتي",
      icon: <User className="w-4 h-4 opacity-70" />,
      count: records.filter(record => record.user_id === user?.id).length
    },
    {
      id: "others",
      label: "سجلات الآخرين",
      icon: <Users className="w-4 h-4 opacity-70" />,
      count: records.filter(record => record.user_id !== user?.id).length
    }
  ];
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>آخر السجلات</span>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>جاري تحميل السجلات...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>آخر السجلات</span>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          عرض أحدث السجلات المضافة في النظام
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TabBar 
          tabs={tabs}
          activeTab={selectedRecordType}
          onTabChange={handleRecordTypeChange}
        />
        
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد سجلات متاحة
          </div>
        ) : (
          <>
            <div className="space-y-4 mt-4">
              {records.map((record) => (
                <div 
                  key={record.id} 
                  className="p-4 bg-muted/40 rounded-lg flex flex-col md:flex-row justify-between gap-4"
                >
                  <div>
                    <h4 className="font-medium">
                      {record.code || 'بدون كود'} - {record.senderName || 'بدون اسم مرسل'}
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      {record.phoneNumber && `${record.phoneNumber} • `}
                      {record.province && `${record.province} • `}
                      {record.date && formatDate(record.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button 
                      variant="outline" 
                      className="text-xs h-8"
                      asChild
                    >
                      <a href={`/automation/${record.id}`}>
                        تفاصيل
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMoreRecords && (
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownWideNarrow className="mr-2 h-4 w-4" />
                  )}
                  تحميل المزيد
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentRecords;
