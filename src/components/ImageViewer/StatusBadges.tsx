
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface StatusBadgesProps {
  counts: {
    all: number;
    pending: number;
    completed: number;
    incomplete: number;
    error: number;
    processing: number;
  };
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ 
  counts, 
  activeFilter,
  onFilterChange
}) => {
  // تعريف تنسيقات البادجات
  const badgeStyles = {
    all: "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300",
    pending: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    completed: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    incomplete: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    error: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    processing: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
  };

  // تأثيرات الحركة
  const badgeVariants = {
    inactive: { scale: 1 },
    active: { scale: 1.05, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
      {/* بادج الكل */}
      <motion.div
        variants={badgeVariants}
        animate={activeFilter === "all" ? "active" : "inactive"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Badge 
          variant={activeFilter === "all" ? "default" : "outline"} 
          className={`cursor-pointer border-2 text-sm px-3 py-1 ${badgeStyles.all} ${activeFilter === "all" ? "border-gray-400 font-bold" : ""}`}
          onClick={() => onFilterChange("all")}
        >
          الكل <span className="inline-flex items-center justify-center bg-white text-gray-800 rounded-full w-5 h-5 text-xs mr-1">{counts.all}</span>
        </Badge>
      </motion.div>
      
      {/* بادج قيد الانتظار */}
      <motion.div
        variants={badgeVariants}
        animate={activeFilter === "pending" ? "active" : "inactive"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Badge 
          variant={activeFilter === "pending" ? "default" : "outline"} 
          className={`cursor-pointer border-2 text-sm px-3 py-1 ${badgeStyles.pending} ${activeFilter === "pending" ? "border-amber-500 font-bold" : ""}`}
          onClick={() => onFilterChange("pending")}
        >
          قيد الانتظار <span className="inline-flex items-center justify-center bg-white text-amber-700 rounded-full w-5 h-5 text-xs mr-1">{counts.pending}</span>
        </Badge>
      </motion.div>
      
      {/* بادج المعالجة */}
      <motion.div
        variants={badgeVariants}
        animate={activeFilter === "processing" ? "active" : "inactive"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Badge 
          variant={activeFilter === "processing" ? "default" : "outline"} 
          className={`cursor-pointer border-2 text-sm px-3 py-1 ${badgeStyles.processing} ${activeFilter === "processing" ? "border-blue-500 font-bold" : ""}`}
          onClick={() => onFilterChange("processing")}
        >
          قيد المعالجة <span className="inline-flex items-center justify-center bg-white text-blue-700 rounded-full w-5 h-5 text-xs mr-1">{counts.processing}</span>
        </Badge>
      </motion.div>
      
      {/* بادج مكتملة */}
      <motion.div
        variants={badgeVariants}
        animate={activeFilter === "completed" ? "active" : "inactive"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Badge 
          variant={activeFilter === "completed" ? "default" : "outline"} 
          className={`cursor-pointer border-2 text-sm px-3 py-1 ${badgeStyles.completed} ${activeFilter === "completed" ? "border-green-500 font-bold" : ""}`}
          onClick={() => onFilterChange("completed")}
        >
          مكتملة <span className="inline-flex items-center justify-center bg-white text-green-700 rounded-full w-5 h-5 text-xs mr-1">{counts.completed}</span>
        </Badge>
      </motion.div>
      
      {/* بادج غير مكتملة */}
      <motion.div
        variants={badgeVariants}
        animate={activeFilter === "incomplete" ? "active" : "inactive"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Badge 
          variant={activeFilter === "incomplete" ? "default" : "outline"} 
          className={`cursor-pointer border-2 text-sm px-3 py-1 ${badgeStyles.incomplete} ${activeFilter === "incomplete" ? "border-purple-500 font-bold" : ""}`}
          onClick={() => onFilterChange("incomplete")}
        >
          غير مكتملة <span className="inline-flex items-center justify-center bg-white text-purple-700 rounded-full w-5 h-5 text-xs mr-1">{counts.incomplete}</span>
        </Badge>
      </motion.div>
      
      {/* بادج أخطاء */}
      <motion.div
        variants={badgeVariants}
        animate={activeFilter === "error" ? "active" : "inactive"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Badge 
          variant={activeFilter === "error" ? "default" : "outline"} 
          className={`cursor-pointer border-2 text-sm px-3 py-1 ${badgeStyles.error} ${activeFilter === "error" ? "border-red-500 font-bold" : ""}`}
          onClick={() => onFilterChange("error")}
        >
          أخطاء <span className="inline-flex items-center justify-center bg-white text-red-700 rounded-full w-5 h-5 text-xs mr-1">{counts.error}</span>
        </Badge>
      </motion.div>
    </div>
  );
};

export default StatusBadges;
