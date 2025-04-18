
import React from 'react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BadgeCheck, 
  AlertCircle, 
  Clock, 
  Circle, 
  CheckCircle, 
  AlertTriangle
} from 'lucide-react';

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
  onFilterChange: (value: string) => void;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ 
  counts, 
  activeFilter, 
  onFilterChange 
}) => {
  return (
    <TabsList className="flex flex-wrap gap-2 p-1">
      <TabsTrigger
        value="all"
        onClick={() => onFilterChange('all')}
        className={`flex items-center ${activeFilter === 'all' ? 'bg-primary text-primary-foreground' : ''}`}
      >
        <Circle className="mr-1 h-4 w-4" />
        الكل <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{counts.all}</span>
      </TabsTrigger>
      
      {counts.pending > 0 && (
        <TabsTrigger
          value="pending"
          onClick={() => onFilterChange('pending')}
          className={`flex items-center ${activeFilter === 'pending' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Clock className="mr-1 h-4 w-4 text-yellow-500" />
          قيد الانتظار <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{counts.pending}</span>
        </TabsTrigger>
      )}
      
      {counts.processing > 0 && (
        <TabsTrigger
          value="processing"
          onClick={() => onFilterChange('processing')}
          className={`flex items-center ${activeFilter === 'processing' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Clock className="mr-1 h-4 w-4 animate-spin text-blue-500" />
          قيد المعالجة <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{counts.processing}</span>
        </TabsTrigger>
      )}
      
      {counts.completed > 0 && (
        <TabsTrigger
          value="completed"
          onClick={() => onFilterChange('completed')}
          className={`flex items-center ${activeFilter === 'completed' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
          مكتمل <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{counts.completed}</span>
        </TabsTrigger>
      )}
      
      {counts.incomplete > 0 && (
        <TabsTrigger
          value="incomplete"
          onClick={() => onFilterChange('incomplete')}
          className={`flex items-center ${activeFilter === 'incomplete' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <AlertTriangle className="mr-1 h-4 w-4 text-orange-500" />
          غير مكتمل <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{counts.incomplete}</span>
        </TabsTrigger>
      )}
      
      {counts.error > 0 && (
        <TabsTrigger
          value="error"
          onClick={() => onFilterChange('error')}
          className={`flex items-center ${activeFilter === 'error' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
          أخطاء <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{counts.error}</span>
        </TabsTrigger>
      )}
    </TabsList>
  );
};

export default StatusBadges;
