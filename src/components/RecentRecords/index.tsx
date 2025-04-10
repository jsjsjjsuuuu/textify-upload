
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useFetchRecords } from './useFetchRecords';
import { FileText, User, Users } from "lucide-react";
import RecordsList from './RecordsList';
import LoadingState from './LoadingState';
import CardHeader from './CardHeader';
import TabBar from './TabBar';
import { useAuth } from "@/contexts/AuthContext";

const RecentRecords = () => {
  const { formatDate } = useImageProcessing();
  const { user } = useAuth();
  const { 
    loading, 
    records, 
    selectedRecordType, 
    hasMoreRecords, 
    isLoadingMore,
    handleRecordTypeChange, 
    handleRefresh, 
    handleLoadMore 
  } = useFetchRecords();
  
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
        <CardHeader onRefresh={handleRefresh} />
        <LoadingState />
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader onRefresh={handleRefresh} />
      <CardContent>
        <TabBar 
          tabs={tabs}
          activeTab={selectedRecordType}
          onTabChange={handleRecordTypeChange}
        />
        
        <RecordsList 
          records={records}
          formatDate={formatDate}
          hasMoreRecords={hasMoreRecords}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
        />
      </CardContent>
    </Card>
  );
};

export default RecentRecords;
