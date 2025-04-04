
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  Inbox 
} from 'lucide-react';

interface StatusFilterProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ 
  statusFilter, 
  onStatusFilterChange 
}) => {
  const statuses = [
    { id: 'all', label: 'الكل', icon: <Inbox className="h-3 w-3 mr-1" /> },
    { id: 'pending', label: 'قيد الانتظار', icon: <Clock className="h-3 w-3 mr-1" /> },
    { id: 'processing', label: 'قيد المعالجة', icon: <Clock className="h-3 w-3 mr-1 animate-spin" /> },
    { id: 'completed', label: 'مكتمل', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    { id: 'error', label: 'خطأ', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    { id: 'submitted', label: 'تم الإرسال', icon: <Upload className="h-3 w-3 mr-1" /> },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status.id}
          size="sm"
          variant={statusFilter === status.id ? "default" : "outline"}
          onClick={() => onStatusFilterChange(status.id)}
          className="text-xs h-7"
        >
          {status.icon}
          {status.label}
        </Button>
      ))}
    </div>
  );
};

export default StatusFilter;
