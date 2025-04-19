
import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgesProps {
  counts: {
    all: number;
    pending: number;
    completed: number;
    processing: number;
    incomplete: number;
    error: number;
  };
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ counts, activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'الكل', count: counts.all },
    { id: 'pending', label: 'قيد الانتظار', count: counts.pending },
    { id: 'processing', label: 'قيد المعالجة', count: counts.processing },
    { id: 'completed', label: 'مكتمل', count: counts.completed },
    { id: 'incomplete', label: 'غير مكتمل', count: counts.incomplete },
    { id: 'error', label: 'خطأ', count: counts.error },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ id, label, count }) => (
        <Badge
          key={id}
          variant={activeFilter === id ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-colors",
            activeFilter === id ? "bg-primary" : "hover:bg-primary/10"
          )}
          onClick={() => onFilterChange(id)}
        >
          {label} ({count})
        </Badge>
      ))}
    </div>
  );
};

export default StatusBadges;
