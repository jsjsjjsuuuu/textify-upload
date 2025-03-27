
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from 'lucide-react';

interface UserFiltersProps {
  searchQuery: string;
  filterPlan: string;
  filterStatus: string;
  onSearchChange: (query: string) => void;
  onPlanFilterChange: (plan: string) => void;
  onStatusFilterChange: (status: string) => void;
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
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <Input
            placeholder="البحث عن مستخدم..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={filterPlan} onValueChange={onPlanFilterChange}>
            <SelectTrigger className="w-full md:w-[170px]">
              <SelectValue placeholder="نوع الباقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">جميع الباقات</SelectItem>
                <SelectItem value="standard">الباقة العادية</SelectItem>
                <SelectItem value="vip">الباقة VIP</SelectItem>
                <SelectItem value="pro">الباقة المتميزة PRO</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full md:w-[170px]">
              <SelectValue placeholder="حالة الحساب" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
