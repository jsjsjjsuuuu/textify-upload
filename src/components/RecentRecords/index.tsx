
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
      count: 0
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
      icon: <AlertCircle className="h-4 w-4" />, 
      count: 0
    },
    { 
      id: "error", 
      label: "أخطاء", 
      icon: <AlertCircle className="h-4 w-4" />, 
      count: 0
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">نظام إدارة السجلات</h2>
        <div className="text-slate-400 text-sm">١٢ أبريل، ٢٠٢٥</div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`task-card flex items-center justify-between p-4 ${activeTab === tab.id ? 'bg-indigo-600/30 border-indigo-400/50' : ''}`}
          >
            <div className="text-white font-medium text-sm">{tab.label}</div>
            <div className={`task-count-badge ${activeTab === tab.id ? 'bg-indigo-600' : 'bg-slate-800'}`}>
              {tab.count}
            </div>
          </button>
        ))}
      </div>
      
      <div className="task-card p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-white">
            <LayoutGrid className="text-indigo-400" size={20} />
            <span className="font-medium">الكل</span>
            <span className="bg-slate-700/80 px-3 py-1 rounded-full text-xs">
              {counts.all} عناصر
            </span>
          </div>
          <button className="bg-indigo-600 rounded-lg p-2 text-white">
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
