
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface CardHeaderProps {
  onRefresh: () => void;
}

const CardHeader = ({ onRefresh }: CardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-bold text-white">نظام إدارة السجلات</h2>
      <div className="flex items-center gap-4">
        <div className="text-slate-400 text-sm">١٢ أبريل، ٢٠٢٥</div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRefresh}
          className="bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CardHeader;
