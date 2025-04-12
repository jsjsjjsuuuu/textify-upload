
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-white/10 overflow-x-auto flex gap-1">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none border-b-2 px-4 py-2 -mb-px text-white/70 hover:text-white hover:bg-white/10",
            activeTab === tab.id
              ? "border-white text-white"
              : "border-transparent"
          )}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="flex items-center gap-2">
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "mr-1 rounded-full px-1.5 py-0.5 text-xs",
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/70"
              )}>
                {tab.count}
              </span>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
};

export default TabBar;
