
import React from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <CardTitle className="text-2xl">لوحة تحكم المسؤول</CardTitle>
        <CardDescription>
          إدارة حسابات المستخدمين والتحكم الكامل في الصلاحيات والاشتراكات
        </CardDescription>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>
    </div>
  );
};

export default AdminHeader;
