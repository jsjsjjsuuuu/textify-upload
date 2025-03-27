
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFiltersProps {
  searchQuery: string;
  filterPlan: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onPlanFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  filterPlan,
  filterStatus,
  onSearchChange,
  onPlanFilterChange,
  onStatusFilterChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="w-full md:w-1/2 lg:w-1/3 relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-3 pr-9"
        />
      </div>
      
      <div className="w-full md:w-1/4">
        <Select 
          value={filterPlan} 
          onValueChange={onPlanFilterChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="فلترة حسب الباقة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الباقات</SelectItem>
            <SelectItem value="standard">الباقة العادية</SelectItem>
            <SelectItem value="vip">الباقة VIP</SelectItem>
            <SelectItem value="pro">الباقة المتميزة PRO</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full md:w-1/4">
        <Select 
          value={filterStatus} 
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="فلترة حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="suspended">موقوف</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default UserFilters;
