
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
    <div className="space-y-10">
      <div className="flex rounded-xl overflow-hidden">
        <button 
          onClick={() => onTabChange('all')}
          className={`flex items-center justify-center gap-2 py-4 px-6 text-base ${activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-[#0e1834]/80 hover:bg-[#1a253f] text-white/80'}`}
          style={{flex: 1}}
        >
          <User className="h-5 w-5" />
          جميع المستخدمين
          <span className={`flex items-center justify-center min-w-[2rem] h-6 rounded-md text-sm font-medium ${activeTab === 'all' ? 'bg-white/20' : 'bg-[#1e2a47]'}`}>
            {totalUsers}
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('approved')}
          className={`flex items-center justify-center gap-2 py-4 px-6 text-base ${activeTab === 'approved' ? 'bg-blue-500 text-white' : 'bg-[#0e1834]/80 hover:bg-[#1a253f] text-white/80'}`}
          style={{flex: 1}}
        >
          <CheckCircle className="h-5 w-5" />
          المعتمدون
          <span className={`flex items-center justify-center min-w-[2rem] h-6 rounded-md text-sm font-medium ${activeTab === 'approved' ? 'bg-white/20' : 'bg-emerald-500/30 text-emerald-300'}`}>
            {approvedUsers}
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('pending')}
          className={`flex items-center justify-center gap-2 py-4 px-6 text-base ${activeTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-[#0e1834]/80 hover:bg-[#1a253f] text-white/80'}`}
          style={{flex: 1}}
        >
          <Clock className="h-5 w-5" />
          في الانتظار
          <span className={`flex items-center justify-center min-w-[2rem] h-6 rounded-md text-sm font-medium ${activeTab === 'pending' ? 'bg-white/20' : 'bg-amber-500/30 text-amber-300'}`}>
            {pendingUsers}
          </span>
        </button>
      </div>
      
      <div>
        {children}
      </div>
    </div>
  );
};

export default UserTabsFilter;
