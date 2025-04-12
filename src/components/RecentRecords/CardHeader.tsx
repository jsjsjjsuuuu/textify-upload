
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

interface CardHeaderProps {
  onRefresh: () => void;
}

const CardHeader = ({ onRefresh }: CardHeaderProps) => {
  // الحصول على التاريخ الحالي بتنسيق عربي
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const arabicDate = today.toLocaleDateString('ar-SA', options);

  return (
    <motion.div 
      className="flex justify-between items-center mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col">
        <h2 className="glass-heading text-2xl">نظام إدارة المهام</h2>
        <p className="text-slate-300 text-sm -mt-4">تتبع وإدارة جميع المهام الخاصة بك</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-slate-400 text-sm">{arabicDate}</div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="glass-button h-9 w-9 p-0"
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh}
            className="glass-button h-9 w-9 p-0"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CardHeader;
