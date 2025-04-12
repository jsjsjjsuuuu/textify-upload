
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface UserFiltersProps {
  searchTerm: string;
  filterRole: string;
  onSearchChange: (term: string) => void;
  onFilterChange: (role: string) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  filterRole,
  onSearchChange,
  onFilterChange
}) => {
  return (
    <div className="dish-effect mb-8">
      <div className="dish-content">
        <div className="p-6 flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-3/4">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-white/50" />
            <Input
              type="text"
              placeholder="ابحث عن مستخدم بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-[#131b31] border-0 text-white pr-12 h-12 shadow-[0_0_8px_rgba(0,0,0,0.2)_inset]"
            />
          </div>
          
          <div className="relative w-full md:w-1/4">
            <Filter className="absolute right-4 top-3.5 h-5 w-5 text-white/50" />
            <select 
              value={filterRole}
              onChange={(e) => onFilterChange(e.target.value)}
              className="bg-[#131b31] border-0 text-white pr-12 h-12 w-full rounded-md shadow-[0_0_8px_rgba(0,0,0,0.2)_inset]"
            >
              <option value="all">جميع الأدوار</option>
              <option value="user">مستخدم</option>
              <option value="admin">مسؤول</option>
              <option value="editor">محرر</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
