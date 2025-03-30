
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfile } from '@/types/UserProfile';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';

interface UserStatsProps {
  stats: {
    total: number;
    approved: number;
    pending: number;
    active?: number;
    suspended?: number;
    expired?: number;
    standard?: number;
    vip?: number;
    pro?: number;
  };
}

const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard 
        title="إجمالي المستخدمين"
        value={stats.total}
        icon={<Users className="h-5 w-5 text-blue-600" />}
        color="bg-blue-50 dark:bg-blue-950"
        textColor="text-blue-600 dark:text-blue-400"
      />
      <StatsCard 
        title="تمت الموافقة"
        value={stats.approved}
        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        color="bg-green-50 dark:bg-green-950"
        textColor="text-green-600 dark:text-green-400"
      />
      <StatsCard 
        title="قيد الانتظار"
        value={stats.pending}
        icon={<Clock className="h-5 w-5 text-amber-600" />}
        color="bg-amber-50 dark:bg-amber-950"
        textColor="text-amber-600 dark:text-amber-400"
      />
      <StatsCard 
        title="نشطين"
        value={stats.active || 0}
        icon={<Users className="h-5 w-5 text-indigo-600" />}
        color="bg-indigo-50 dark:bg-indigo-950"
        textColor="text-indigo-600 dark:text-indigo-400"
      />
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, textColor }) => {
  return (
    <Card className={`${color} border-0 shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h4 className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</h4>
          </div>
          <div className={`p-2 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStats;
