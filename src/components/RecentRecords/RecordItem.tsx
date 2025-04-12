
import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, ChevronLeft } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { formatDate } from "@/utils/dateFormatter";
import { motion } from "framer-motion";

interface RecordItemProps {
  record: ImageData;
}

const RecordItem = ({ record }: RecordItemProps) => {
  // تحديد الرمز والنص واللون حسب حالة السجل
  const getStatusInfo = () => {
    switch (record.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="text-emerald-400" size={24} />,
          text: "مكتمل",
          statusClass: "task-status-completed",
          bgClass: "bg-emerald-700/30",
          glowClass: "emerald"
        };
      case 'pending':
        return {
          icon: <Clock className="text-amber-400" size={24} />,
          text: "قيد الانتظار",
          statusClass: "task-status-pending",
          bgClass: "bg-amber-700/30",
          glowClass: "amber"
        };
      case 'processing':
        return {
          icon: <Clock className="text-blue-400" size={24} />,
          text: "قيد المعالجة",
          statusClass: "task-status-processing",
          bgClass: "bg-blue-700/30",
          glowClass: "blue"
        };
      case 'error':
        return {
          icon: <AlertCircle className="text-red-400" size={24} />,
          text: "خطأ",
          statusClass: "task-status-error",
          bgClass: "bg-red-700/30",
          glowClass: "red"
        };
      default:
        return {
          icon: <XCircle className="text-rose-400" size={24} />,
          text: "غير مكتملة",
          statusClass: "task-status-incomplete",
          bgClass: "bg-rose-700/30",
          glowClass: "rose"
        };
    }
  };

  const { icon, text, statusClass, bgClass, glowClass } = getStatusInfo();

  // ايجاد رقم المهمة المختصر
  const taskId = record.id ? `#${record.id.toString().slice(0, 4)}` : "#0000";

  return (
    <motion.div 
      className="task-item"
      whileHover={{ 
        scale: 1.01,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
      }}
    >
      <div className="flex items-center">
        <div className={`${statusClass} rounded-md px-4 py-1.5 text-sm backdrop-blur-md`}>
          {text}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-white font-semibold gradient-text">
          مهمة {taskId}
        </div>
        <div className="text-slate-400 text-sm">
          {record.status === 'completed' ? 'تم الانتهاء بتاريخ ' : 'تم التحديث بتاريخ '}
          {formatDate(record.date)}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`${bgClass} rounded-xl p-2.5 glow-icon ${glowClass}`}>
          {icon}
        </div>
        <motion.div 
          className="glass-button h-8 w-8 flex items-center justify-center p-0"
          whileHover={{ x: 3 }}
        >
          <ChevronLeft size={18} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RecordItem;
