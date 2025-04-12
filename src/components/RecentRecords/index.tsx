
import React, { useState } from 'react';
import { LayoutGrid, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import CardHeader from './CardHeader';
import TabBar, { TabItem } from './TabBar';
import RecordsList from './RecordsList';
import useFetchRecords from './useFetchRecords';
import { Button } from "@/components/ui/button";

const RecentRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const { data, isLoading, isError, refetch, filteredData, counts } = useFetchRecords(activeTab);

  const tabs: TabItem[] = [
    { 
      id: "all", 
      label: "الكل", 
      icon: <LayoutGrid className="h-4 w-4" />, 
      count: counts.all 
    },
    { 
      id: "processing", 
      label: "قيد المعالجة", 
      icon: <Clock className="h-4 w-4" />, 
      count: counts.processing 
    },
    { 
      id: "pending", 
      label: "قيد الانتظار", 
      icon: <Clock className="h-4 w-4" />, 
      count: counts.pending 
    },
    { 
      id: "completed", 
      label: "مكتملة", 
      icon: <CheckCircle className="h-4 w-4" />, 
      count: counts.completed 
    },
    { 
      id: "incomplete", 
      label: "غير مكتملة", 
      icon: <XCircle className="h-4 w-4" />, 
      count: counts.incomplete || 0 
    },
    { 
      id: "error", 
      label: "أخطاء", 
      icon: <AlertCircle className="h-4 w-4" />, 
      count: counts.error 
    }
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="task-system-bg p-6 rounded-xl shadow-xl">
      <CardHeader onRefresh={handleRefresh} />
      
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="glass-card p-4 mb-6 mt-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-white">
            <LayoutGrid className="text-indigo-400" size={20} />
            <span className="font-medium">{tabs.find(tab => tab.id === activeTab)?.label || "الكل"}</span>
            <span className="count-badge">
              {activeTab === 'all' ? counts.all : 
               activeTab === 'processing' ? counts.processing : 
               activeTab === 'completed' ? counts.completed : 
               activeTab === 'pending' ? counts.pending : 
               activeTab === 'incomplete' ? counts.incomplete || 0 :
               activeTab === 'error' ? counts.error : 0} عناصر
            </span>
          </div>
          <Button className="glass-button h-9 w-9 p-0">
            <LayoutGrid size={18} />
          </Button>
        </div>
      </div>
      
      <RecordsList 
        records={filteredData}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
};

export default RecentRecords;
