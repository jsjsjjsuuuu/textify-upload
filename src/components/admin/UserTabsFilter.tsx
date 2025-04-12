
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
      <div className="admin-tabs">
        <button 
          onClick={() => onTabChange('all')}
          className={`admin-tab ${activeTab === 'all' ? 'admin-tab-active' : 'admin-tab-inactive'}`}
        >
          <span className="flex items-center justify-center gap-3">
            <User className="h-5 w-5" />
            جميع المستخدمين
            <span className="admin-badge-count admin-badge-all">{totalUsers}</span>
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('pending')}
          className={`admin-tab ${activeTab === 'pending' ? 'admin-tab-active' : 'admin-tab-inactive'}`}
        >
          <span className="flex items-center justify-center gap-3">
            <Clock className="h-5 w-5" />
            في الانتظار
            <span className="admin-badge-count admin-badge-pending">{pendingUsers}</span>
          </span>
        </button>
        
        <button 
          onClick={() => onTabChange('approved')}
          className={`admin-tab ${activeTab === 'approved' ? 'admin-tab-active' : 'admin-tab-inactive'}`}
        >
          <span className="flex items-center justify-center gap-3">
            <CheckCircle className="h-5 w-5" />
            المعتمدون
            <span className="admin-badge-count admin-badge-approved">{approvedUsers}</span>
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
