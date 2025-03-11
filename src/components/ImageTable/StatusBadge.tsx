
import React from "react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "processing" | "completed" | "error";
  submitted?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, submitted }) => {
  if (status === "processing") {
    return (
      <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-yellow-100/80 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800/50 dark:text-yellow-400">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse mr-1.5"></span>
        قيد المعالجة
      </Badge>
    );
  }

  if (status === "completed" && !submitted) {
    return (
      <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-blue-100/80 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
        تم المعالجة
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-red-100/80 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
        فشل
      </Badge>
    );
  }

  if (submitted) {
    return (
      <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-green-100/80 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
        تم الإرسال
      </Badge>
    );
  }

  return null;
};

export default StatusBadge;
