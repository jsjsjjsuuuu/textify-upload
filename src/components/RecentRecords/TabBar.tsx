
import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`glass-card flex items-center justify-between p-4 ${
            activeTab === tab.id ? 'active-tab' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`task-icon-wrapper ${
              activeTab === tab.id ? 'text-indigo-300' : 'text-slate-400'
            }`}>
              {tab.icon}
            </div>
            <span className="text-white text-sm">{tab.label}</span>
          </div>
          <div className={`task-count-badge ${
            activeTab === tab.id ? 'bg-indigo-600' : 'bg-[#232a3c]'
          }`}>
            {tab.count}
          </div>
        </button>
      ))}
    </div>
  );
};

export default TabBar;
