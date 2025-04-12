
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Database, FileText, Package, LayoutGrid, AlertCircle, CheckCircle, Clock } from "lucide-react";
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
      
      <div className="task-card p-4 mb-6 mt-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-white">
            <LayoutGrid className="text-indigo-400" size={20} />
            <span className="font-medium">{tabs.find(tab => tab.id === activeTab)?.label || "الكل"}</span>
            <span className="bg-slate-700/80 px-3 py-1 rounded-full text-xs">
              {activeTab === 'all' ? counts.all : activeTab === 'processing' ? counts.processing : 
               activeTab === 'completed' ? counts.completed : activeTab === 'pending' ? counts.pending : 
               activeTab === 'error' ? counts.error : 0} عناصر
            </span>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg p-2 text-white">
            <LayoutGrid size={18} />
          </button>
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
