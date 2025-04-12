
import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { formatDate } from "@/utils/dateFormatter";

interface RecordItemProps {
  record: ImageData;
}

const RecordItem = ({ record }: RecordItemProps) => {
  // تحديد الرمز والنص واللون حسب حالة السجل
  const getStatusInfo = () => {
    switch (record.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="text-emerald-500" size={24} />,
          text: "مكتمل",
          statusClass: "task-status-completed",
          bgClass: "bg-emerald-700/30"
        };
      case 'pending':
        return {
          icon: <Clock className="text-amber-500" size={24} />,
          text: "قيد الانتظار",
          statusClass: "task-status-pending",
          bgClass: "bg-amber-700/30"
        };
      case 'processing':
        return {
          icon: <Clock className="text-blue-500" size={24} />,
          text: "قيد المعالجة",
          statusClass: "task-status-processing",
          bgClass: "bg-blue-700/30"
        };
      case 'error':
        return {
          icon: <AlertCircle className="text-red-500" size={24} />,
          text: "خطأ",
          statusClass: "task-status-error",
          bgClass: "bg-red-700/30"
        };
      default:
        return {
          icon: <XCircle className="text-rose-500" size={24} />,
          text: "غير مكتملة",
          statusClass: "task-status-incomplete",
          bgClass: "bg-rose-700/30"
        };
    }
  };

  const { icon, text, statusClass, bgClass } = getStatusInfo();

  // ايجاد رقم المهمة المختصر
  const taskId = record.id ? `#${record.id.toString().slice(0, 4)}` : "#0000";

  return (
    <div className="task-item">
      <div className="flex items-center">
        <div className={`${statusClass} rounded-md px-4 py-1 text-sm`}>
          {text}
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div className="text-white font-semibold">
          مهمة {taskId}
        </div>
        <div className="text-slate-400 text-sm">
          {record.status === 'completed' ? 'تم الانتهاء بتاريخ ' : 'تم التحديث بتاريخ '}
          {formatDate(record.date)}
        </div>
      </div>

      <div className={`${bgClass} rounded-xl p-2`}>
        {icon}
      </div>
    </div>
  );
};

export default RecordItem;
