
import React from 'react';
import { Search, Filter, SortAsc } from 'lucide-react';
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
    <div className="admin-filters">
      <div className="admin-search">
        <Search className="absolute right-5 top-3.5 h-5 w-5 text-blue-200/60" />
        <input
          type="text"
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="admin-search-input"
        />
      </div>
      
      <div className="w-full md:w-1/4">
        <select 
          value={filterPlan} 
          onChange={(e) => onPlanFilterChange(e.target.value)}
          className="admin-select"
        >
          <option value="all">جميع الباقات</option>
          <option value="standard">الباقة العادية</option>
          <option value="vip">الباقة VIP</option>
          <option value="pro">الباقة المتميزة PRO</option>
        </select>
      </div>
      
      <div className="w-full md:w-1/4">
        <select 
          value={filterStatus} 
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="admin-select"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف</option>
          <option value="expired">منتهي</option>
        </select>
      </div>
    </div>
  );
};

export default UserFilters;
