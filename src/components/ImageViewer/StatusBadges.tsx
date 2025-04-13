
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Clock, XCircle, Activity, LayoutGrid } from "lucide-react";

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
  // تعريف تنسيقات البادجات مع دمج الأيقونات
  const badges = [
    {
      id: "all",
      label: "الكل",
      count: counts.all,
      icon: <LayoutGrid className="h-3.5 w-3.5 ml-1" />,
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300",
      activeClassName: "border-gray-400 font-bold"
    },
    {
      id: "pending",
      label: "قيد الانتظار",
      count: counts.pending,
      icon: <Clock className="h-3.5 w-3.5 ml-1" />,
      className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      activeClassName: "border-amber-500 font-bold"
    },
    {
      id: "processing",
      label: "قيد المعالجة",
      count: counts.processing,
      icon: <Activity className="h-3.5 w-3.5 ml-1" />,
      className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      activeClassName: "border-blue-500 font-bold"
    },
    {
      id: "completed",
      label: "مكتملة",
      count: counts.completed,
      icon: <CheckCircle className="h-3.5 w-3.5 ml-1" />,
      className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      activeClassName: "border-green-500 font-bold"
    },
    {
      id: "incomplete",
      label: "غير مكتملة",
      count: counts.incomplete,
      icon: <XCircle className="h-3.5 w-3.5 ml-1" />,
      className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
      activeClassName: "border-purple-500 font-bold"
    },
    {
      id: "error",
      label: "أخطاء",
      count: counts.error,
      icon: <AlertCircle className="h-3.5 w-3.5 ml-1" />,
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      activeClassName: "border-red-500 font-bold"
    }
  ];

  // تأثيرات الحركة
  const badgeVariants = {
    inactive: { scale: 1 },
    active: { scale: 1.05, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end mb-4" dir="rtl">
      {badges.map(badge => (
        <motion.div
          key={badge.id}
          variants={badgeVariants}
          animate={activeFilter === badge.id ? "active" : "inactive"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Badge 
            variant={activeFilter === badge.id ? "default" : "outline"} 
            className={`cursor-pointer border-2 text-sm px-3 py-1 ${badge.className} ${activeFilter === badge.id ? badge.activeClassName : ""}`}
            onClick={() => onFilterChange(badge.id)}
          >
            <div className="flex items-center">
              {badge.icon}
              {badge.label}
            </div>
            <span className={`inline-flex items-center justify-center bg-white rounded-full w-5 h-5 text-xs mr-1 ${
              activeFilter === badge.id 
                ? "bg-white/20 text-current" 
                : `text-${badge.id === "all" ? "gray" : badge.id === "pending" ? "amber" : badge.id === "processing" ? "blue" : badge.id === "completed" ? "green" : badge.id === "incomplete" ? "purple" : "red"}-700`
            }`}>
              {badge.count}
            </span>
          </Badge>
        </motion.div>
      ))}
    </div>
  );
};

export default StatusBadges;
