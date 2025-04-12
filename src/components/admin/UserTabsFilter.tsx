
import React from 'react';
import { User, CheckCircle, Clock } from 'lucide-react';

interface UserTabsFilterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  children: React.ReactNode;
}

const UserTabsFilter: React.FC<UserTabsFilterProps> = ({
  activeTab,
  onTabChange,
  totalUsers,
  pendingUsers,
  approvedUsers,
  children
}) => {
  return (
    <div className="mb-8">
      <div className="flex mb-8 rounded-xl p-0 overflow-hidden">
        <button 
          onClick={() => onTabChange('all')}
          className={`flex flex-1 items-center justify-center gap-3 py-4 px-6 transition-all duration-200 ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-[#131b31] hover:bg-[#1a253f] text-white/70'}`}
        >
          <User className="h-5 w-5" />
          جميع المستخدمين
          <span className={`flex items-center justify-center min-w-[2.5rem] h-8 rounded-xl text-sm font-medium ${activeTab === 'all' ? 'bg-white/20' : 'bg-[#1e2a47]'}`}>
            {totalUsers}
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('approved')}
          className={`flex flex-1 items-center justify-center gap-3 py-4 px-6 transition-all duration-200 ${activeTab === 'approved' ? 'bg-primary text-white' : 'bg-[#131b31] hover:bg-[#1a253f] text-white/70'}`}
        >
          <CheckCircle className="h-5 w-5" />
          المعتمدون
          <span className={`flex items-center justify-center min-w-[2.5rem] h-8 rounded-xl text-sm font-medium ${activeTab === 'approved' ? 'bg-white/20' : 'bg-emerald-500/30 text-emerald-300'}`}>
            {approvedUsers}
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('pending')}
          className={`flex flex-1 items-center justify-center gap-3 py-4 px-6 transition-all duration-200 ${activeTab === 'pending' ? 'bg-primary text-white' : 'bg-[#131b31] hover:bg-[#1a253f] text-white/70'}`}
        >
          <Clock className="h-5 w-5" />
          في الانتظار
          <span className={`flex items-center justify-center min-w-[2.5rem] h-8 rounded-xl text-sm font-medium ${activeTab === 'pending' ? 'bg-white/20' : 'bg-amber-500/30 text-amber-300'}`}>
            {pendingUsers}
          </span>
        </button>
      </div>
      
      <div className="mt-8">
        {children}
      </div>
    </div>
  );
};

export default UserTabsFilter;
