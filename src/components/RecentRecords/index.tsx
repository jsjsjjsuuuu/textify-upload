
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Clock, AlertCircle, CheckCircle, XCircle, Activity } from "lucide-react";
import CardHeader from './CardHeader';
import TabBar, { TabItem } from './TabBar';
import RecordsList from './RecordsList';
import useFetchRecords from './useFetchRecords';
import { Button } from "@/components/ui/button";

const RecentRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const { data, isLoading, isError, refetch, filteredData, counts } = useFetchRecords(activeTab);

  // عناصر البرق العائمة لتعزيز تأثير الزجاج المورفي
  const glassElements = [
    { top: '10%', left: '5%', width: '20rem', height: '20rem', from: 'from-blue-500/10', to: 'to-purple-500/5' },
    { top: '60%', right: '10%', width: '25rem', height: '25rem', from: 'from-indigo-500/10', to: 'to-pink-500/5' },
    { bottom: '5%', left: '30%', width: '18rem', height: '18rem', from: 'from-violet-500/10', to: 'to-blue-500/5' }
  ];

  const tabs: TabItem[] = [
    { 
      id: "all", 
      label: "الكل", 
      icon: <LayoutGrid className="h-4 w-4" />, 
      count: counts.all,
      color: "bg-indigo-500/80"
    },
    { 
      id: "processing", 
      label: "قيد المعالجة", 
      icon: <Activity className="h-4 w-4" />, 
      count: counts.processing,
      color: "bg-blue-500/80"
    },
    { 
      id: "pending", 
      label: "قيد الانتظار", 
      icon: <Clock className="h-4 w-4" />, 
      count: counts.pending,
      color: "bg-amber-500/80"
    },
    { 
      id: "completed", 
      label: "مكتملة", 
      icon: <CheckCircle className="h-4 w-4" />, 
      count: counts.completed,
      color: "bg-emerald-500/80"
    },
    { 
      id: "incomplete", 
      label: "غير مكتملة", 
      icon: <XCircle className="h-4 w-4" />, 
      count: counts.incomplete || 0,
      color: "bg-rose-500/80" 
    },
    { 
      id: "error", 
      label: "أخطاء", 
      icon: <AlertCircle className="h-4 w-4" />, 
      count: counts.error,
      color: "bg-red-500/80"
    }
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="task-system-bg p-6 rounded-xl shadow-xl relative overflow-hidden">
      {/* عناصر الزجاج في الخلفية */}
      {glassElements.map((el, index) => (
        <div 
          key={index}
          className={`glass-bg-element ${el.from} ${el.to}`}
          style={{
            top: el?.top,
            left: el?.left,
            right: el?.right,
            bottom: el?.bottom,
            width: el.width,
            height: el.height
          }}
        />
      ))}
      
      <div className="relative z-10">
        <CardHeader onRefresh={handleRefresh} />
        
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        <div className="glass-card p-4 mb-6 mt-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-white">
              {tabs.find(tab => tab.id === activeTab)?.icon && (
                <span className={`glow-icon ${activeTab === 'completed' ? 'emerald' : 
                                              activeTab === 'processing' ? 'blue' : 
                                              activeTab === 'pending' ? 'amber' :
                                              activeTab === 'error' ? 'red' :
                                              activeTab === 'incomplete' ? 'rose' : ''}`}>
                  {tabs.find(tab => tab.id === activeTab)?.icon}
                </span>
              )}
              <span className="font-medium gradient-text">{tabs.find(tab => tab.id === activeTab)?.label || "الكل"}</span>
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
    </div>
  );
};

export default RecentRecords;
