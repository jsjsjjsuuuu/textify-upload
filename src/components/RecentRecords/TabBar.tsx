
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface TabBarProps {
  tabs: { id: string; label: string; icon: React.ReactNode; count: number }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabBar = ({ tabs, activeTab, onTabChange }: TabBarProps) => {
  return (
    <div className="flex overflow-x-auto scrollbar-hide pb-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex items-center px-4 py-2 border-b-2 whitespace-nowrap flex-shrink-0 transition-colors relative
            ${activeTab === tab.id 
              ? "border-primary text-primary font-medium" 
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          <span className="mx-1.5">{tab.label}</span>
          {tab.count > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full 
              ${activeTab === tab.id 
                ? "bg-primary/10 text-primary" 
                : "bg-muted-foreground/10 text-muted-foreground"}`}>
              {tab.count}
            </span>
          )}
          
          {/* القطعة المتحركة تحت التبويب النشط */}
          {activeTab === tab.id && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              layoutId="activeTab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export const useRecordTabs = (records: any[] = []) => {
  const [activeTab, setActiveTab] = useState("all");
  
  const tabs = [
    {
      id: "all",
      label: "الكل",
      icon: <FileText className="w-4 h-4 opacity-70" />,
      count: records.length
    },
    {
      id: "today",
      label: "اليوم",
      icon: <Calendar className="w-4 h-4 opacity-70" />,
      count: records.filter(record => {
        const today = new Date();
        const recordDate = new Date(record.date || record.created_at);
        return (
          recordDate.getDate() === today.getDate() &&
          recordDate.getMonth() === today.getMonth() &&
          recordDate.getFullYear() === today.getFullYear()
        );
      }).length
    },
    {
      id: "pending",
      label: "غير مكتملة",
      icon: <AlertCircle className="w-4 h-4 opacity-70" />,
      count: records.filter(record => !record.submitted).length
    },
    {
      id: "completed",
      label: "مكتملة",
      icon: <CheckCircle className="w-4 h-4 opacity-70" />,
      count: records.filter(record => record.submitted).length
    },
    {
      id: "processing",
      label: "قيد المعالجة",
      icon: <Loader className="w-4 h-4 opacity-70" />,
      count: records.filter(record => record.status === "processing").length
    }
  ];
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  const getFilteredRecords = () => {
    switch (activeTab) {
      case "today":
        return records.filter(record => {
          const today = new Date();
          const recordDate = new Date(record.date || record.created_at);
          return (
            recordDate.getDate() === today.getDate() &&
            recordDate.getMonth() === today.getMonth() &&
            recordDate.getFullYear() === today.getFullYear()
          );
        });
      case "pending":
        return records.filter(record => !record.submitted);
      case "completed":
        return records.filter(record => record.submitted);
      case "processing":
        return records.filter(record => record.status === "processing");
      default:
        return records;
    }
  };
  
  return {
    tabs,
    activeTab,
    handleTabChange,
    getFilteredRecords
  };
};

export default TabBar;
