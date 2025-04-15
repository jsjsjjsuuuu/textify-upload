
import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, InboxIcon } from 'lucide-react';

interface OrderStatsProps {
  stats: {
    total: number;
    new: number;
    processing: number;
    completed: number;
  };
}

const OrderStats: React.FC<OrderStatsProps> = ({ stats }) => {
  const StatCard = ({ title, value, icon: Icon, color }: { 
    title: string; 
    value: number; 
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="dish-container">
      <div className="dish-glow-top"></div>
      <div className="dish-glow-bottom"></div>
      <div className="dish-reflection"></div>
      <div className="dish-inner-shadow"></div>
      <div className="relative z-10">
        <Card className="p-4 bg-[#131b31] border-0">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="المجموع الكلي"
        value={stats.total}
        icon={FileText}
        color="bg-indigo-500/10 text-indigo-500"
      />
      <StatCard
        title="طلبات جديدة"
        value={stats.new}
        icon={InboxIcon}
        color="bg-blue-500/10 text-blue-500"
      />
      <StatCard
        title="قيد المعالجة"
        value={stats.processing}
        icon={Clock}
        color="bg-yellow-500/10 text-yellow-500"
      />
      <StatCard
        title="مكتملة"
        value={stats.completed}
        icon={CheckCircle}
        color="bg-green-500/10 text-green-500"
      />
    </div>
  );
};

export default OrderStats;
