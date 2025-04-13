
import React from 'react';
import { Search } from 'lucide-react';

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
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2 relative">
        <Search className="absolute left-5 top-5 h-5 w-5 text-blue-200/60" />
        <input
          type="text"
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#0e1834]/80 rounded-xl py-5 pl-14 pr-5 text-base text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          dir="rtl"
        />
      </div>
      
      <div className="w-full md:w-1/4">
        <select 
          value={filterPlan} 
          onChange={(e) => onPlanFilterChange(e.target.value)}
          className="w-full bg-[#0e1834]/80 rounded-xl py-5 px-5 text-base text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/30 appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1.25rem center', backgroundSize: '.75rem auto' }}
          dir="rtl"
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
          className="w-full bg-[#0e1834]/80 rounded-xl py-5 px-5 text-base text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/30 appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 1.25rem center', backgroundSize: '.75rem auto' }}
          dir="rtl"
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
