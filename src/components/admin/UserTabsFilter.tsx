
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
    <div className="space-y-8">
      <div className="flex rounded-xl overflow-hidden">
        <button 
          onClick={() => onTabChange('all')}
          className={`flex items-center justify-center gap-2 py-3 px-5 text-sm ${activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-[#0e1834]/80 hover:bg-[#1a253f] text-white/80'}`}
          style={{flex: 1}}
        >
          <User className="h-4 w-4" />
          جميع المستخدمين
          <span className={`flex items-center justify-center min-w-[1.5rem] h-5 rounded-md text-xs font-medium ${activeTab === 'all' ? 'bg-white/20' : 'bg-[#1e2a47]'}`}>
            {totalUsers}
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('approved')}
          className={`flex items-center justify-center gap-2 py-3 px-5 text-sm ${activeTab === 'approved' ? 'bg-blue-500 text-white' : 'bg-[#0e1834]/80 hover:bg-[#1a253f] text-white/80'}`}
          style={{flex: 1}}
        >
          <CheckCircle className="h-4 w-4" />
          المعتمدون
          <span className={`flex items-center justify-center min-w-[1.5rem] h-5 rounded-md text-xs font-medium ${activeTab === 'approved' ? 'bg-white/20' : 'bg-emerald-500/30 text-emerald-300'}`}>
            {approvedUsers}
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('pending')}
          className={`flex items-center justify-center gap-2 py-3 px-5 text-sm ${activeTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-[#0e1834]/80 hover:bg-[#1a253f] text-white/80'}`}
          style={{flex: 1}}
        >
          <Clock className="h-4 w-4" />
          في الانتظار
          <span className={`flex items-center justify-center min-w-[1.5rem] h-5 rounded-md text-xs font-medium ${activeTab === 'pending' ? 'bg-white/20' : 'bg-amber-500/30 text-amber-300'}`}>
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
