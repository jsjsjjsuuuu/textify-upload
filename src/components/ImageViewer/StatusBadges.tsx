
import React from 'react';
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Clock, XCircle, Activity, LayoutGrid } from "lucide-react";

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
  // تعريف الأيقونات والألوان لكل حالة
  const badges = [
    {
      id: "all",
      label: "الكل",
      count: counts.all,
      icon: <LayoutGrid className="h-4 w-4" />,
      className: "bg-white text-gray-800 border-gray-200 hover:border-gray-300",
    },
    {
      id: "pending",
      label: "قيد الانتظار",
      count: counts.pending,
      icon: <Clock className="h-4 w-4" />,
      className: "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300",
    },
    {
      id: "processing",
      label: "قيد المعالجة",
      count: counts.processing,
      icon: <Activity className="h-4 w-4" />,
      className: "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300",
    },
    {
      id: "completed",
      label: "مكتملة",
      count: counts.completed,
      icon: <CheckCircle className="h-4 w-4" />,
      className: "bg-green-50 text-green-700 border-green-200 hover:border-green-300",
    },
    {
      id: "incomplete",
      label: "غير مكتملة",
      count: counts.incomplete,
      icon: <XCircle className="h-4 w-4" />,
      className: "bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300",
    },
    {
      id: "error",
      label: "أخطاء",
      count: counts.error,
      icon: <AlertTriangle className="h-4 w-4" />,
      className: "bg-red-50 text-red-700 border-red-200 hover:border-red-300",
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
      {badges.map(badge => (
        <motion.button
          key={badge.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onFilterChange(badge.id)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full
            border-2 transition-colors
            ${badge.className}
            ${activeFilter === badge.id ? 'ring-2 ring-offset-2 ring-brand-brown/20' : ''}
          `}
        >
          {badge.icon}
          <span className="text-sm font-medium whitespace-nowrap">
            {badge.label}
          </span>
          <span className={`
            inline-flex items-center justify-center 
            h-5 w-5 text-xs font-semibold rounded-full
            ${activeFilter === badge.id 
              ? 'bg-white/20 text-current' 
              : 'bg-white text-current'}
          `}>
            {badge.count}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default StatusBadges;
