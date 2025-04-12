
import React from "react";
import { motion } from "framer-motion";

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  color?: string;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`glass-card flex items-center justify-between p-4 ${
            activeTab === tab.id ? 'active-tab' : ''
          }`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
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
            activeTab === tab.id ? tab.color || 'bg-indigo-600/80' : 'bg-[#232a3c]/80'
          } ${activeTab === tab.id ? 'shadow-[0_0_10px_rgba(99,102,241,0.4)]' : ''}`}>
            {tab.count}
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default TabBar;
