
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Database, FileText, Package } from "lucide-react";
import CardHeader from './CardHeader';
import TabBar, { TabItem } from './TabBar';
import RecordsList from './RecordsList';
import useFetchRecords from './useFetchRecords';

const RecentRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const { data, isLoading, isError, refetch, filteredData, counts } = useFetchRecords(activeTab);

  const tabs: TabItem[] = [
    { 
      id: "all", 
      label: "الكل", 
      icon: <Database className="h-4 w-4" />, 
      count: counts.all 
    },
    { 
      id: "processing", 
      label: "قيد المعالجة", 
      icon: <FileText className="h-4 w-4" />, 
      count: counts.processing 
    },
    { 
      id: "completed", 
      label: "مكتملة", 
      icon: <Package className="h-4 w-4" />, 
      count: counts.completed 
    }
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className="mb-6 glass-card border-none shadow-xl" dir="rtl">
      <CardHeader onRefresh={handleRefresh} />
      
      <div className="px-4 pb-2">
        <TabBar 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
      </div>
      
      <RecordsList 
        records={filteredData}
        isLoading={isLoading}
        isError={isError}
      />
    </Card>
  );
};

export default RecentRecords;
