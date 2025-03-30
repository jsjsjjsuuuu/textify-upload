
import React from 'react';
import UserFilters from './UserFilters';
import UserTabsFilter from './UserTabsFilter';
import UserTable from './UserTable';
import UserEditForm from './UserEditForm';
import { UserProfile } from '@/types/UserProfile';

interface UserManagementPanelProps {
  searchQuery: string;
  filterPlan: string;
  filterStatus: string;
  activeTab: string;
  isEditingUser: string | null;
  editedUserData: UserProfile | null;
  isProcessing: boolean;
  selectedDate: Date | undefined;
  userCounts: {
    total: number;
    pending: number;
    approved: number;
  };
  filteredUsers: UserProfile[];
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onPlanFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTabChange: (value: string) => void;
  onEdit: (user: UserProfile) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onUserDataChange: (field: string, value: any) => void;
  onDateSelect: (date: Date | undefined) => void;
  onEmailChange: (userId: string, newEmail: string) => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  searchQuery,
  filterPlan,
  filterStatus,
  activeTab,
  isEditingUser,
  editedUserData,
  isProcessing,
  selectedDate,
  userCounts,
  filteredUsers,
  isLoading,
  onSearchChange,
  onPlanFilterChange,
  onStatusFilterChange,
  onTabChange,
  onEdit,
  onApprove,
  onReject,
  onCancel,
  onSave,
  onUserDataChange,
  onDateSelect,
  onEmailChange
}) => {
  return (
    <>
      <UserFilters 
        searchQuery={searchQuery}
        filterPlan={filterPlan}
        filterStatus={filterStatus}
        onSearchChange={onSearchChange}
        onPlanFilterChange={onPlanFilterChange}
        onStatusFilterChange={onStatusFilterChange}
      />
      
      <UserTabsFilter
        activeTab={activeTab}
        onTabChange={onTabChange}
        totalUsers={userCounts.total}
        pendingUsers={userCounts.pending}
        approvedUsers={userCounts.approved}
      >
        {isEditingUser ? (
          <UserEditForm 
            userData={editedUserData!}
            isProcessing={isProcessing}
            selectedDate={selectedDate}
            onCancel={onCancel}
            onSave={onSave}
            onUserDataChange={onUserDataChange}
            onDateSelect={onDateSelect}
            onEmailChange={onEmailChange}
          />
        ) : (
          <UserTable 
            users={filteredUsers}
            isLoading={isLoading}
            onEdit={onEdit}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}
      </UserTabsFilter>
    </>
  );
};

export default UserManagementPanel;
