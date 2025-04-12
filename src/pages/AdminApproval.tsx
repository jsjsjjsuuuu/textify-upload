
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserTable from '@/components/admin/UserTable';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import UserTabsFilter from '@/components/admin/UserTabsFilter';
import UserFilters from '@/components/admin/UserFilters';
import { useUserManagement } from '@/hooks/useUserManagement';
import UserEditForm from '@/components/admin/UserEditForm';
import { Button } from '@/components/ui/button';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog';
import { Users, RefreshCw } from 'lucide-react';

const AdminApproval = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  // استخدام hook إدارة المستخدمين
  const {
    users,
    filteredUsers,
    isLoading,
    error,
    selectedUser,
    resetPasswordUser,
    resetPasswordProcessing,
    updateUserRole,
    approveUser,
    deleteUser,
    setSelectedUser,
    setResetPasswordUser,
    refreshUsers,
    handleResetPassword,
    totalUsers,
    pendingUsers,
    approvedUsers,
  } = useUserManagement();

  // التأكد من أن المستخدم مسؤول
  useEffect(() => {
    if (user && user.user_metadata?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleFilterChange = (role: string) => {
    setFilterRole(role);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* إضافة تأثير الطبق المجسم */}
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="dish-effect">
          <div className="dish-glow"></div>
          <div className="dish-content">
            <div className="dish-inner">
              <div className="dish-shimmer"></div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
                    <Users className="h-7 w-7 text-blue-400" />
                    إدارة المستخدمين
                  </h1>
                  <p className="text-white/60 mt-2 text-lg">
                    يمكنك إدارة المستخدمين واعتمادهم وتغيير أدوارهم من هنا
                  </p>
                </div>
                
                <Button
                  onClick={refreshUsers}
                  variant="outline"
                  className="bg-[#1a253f] hover:bg-[#243050] text-white/90 border-0 flex items-center gap-2 self-start md:self-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </Button>
              </div>
              
              <UserFilters
                searchTerm={searchTerm}
                filterRole={filterRole}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
              />
              
              <UserTabsFilter
                activeTab={activeTab}
                onTabChange={handleTabChange}
                totalUsers={totalUsers}
                pendingUsers={pendingUsers}
                approvedUsers={approvedUsers}
              >
                <UserTable
                  users={filteredUsers}
                  isLoading={isLoading}
                  error={error}
                  onApprove={approveUser}
                  onDelete={deleteUser}
                  onEdit={setSelectedUser}
                  onResetPassword={setResetPasswordUser}
                />
              </UserTabsFilter>
              
              {selectedUser && (
                <UserEditForm
                  user={selectedUser}
                  onClose={() => setSelectedUser(null)}
                  onUpdateRole={updateUserRole}
                />
              )}
              
              {resetPasswordUser && (
                <ResetPasswordDialog
                  isOpen={!!resetPasswordUser}
                  onOpenChange={() => setResetPasswordUser(null)}
                  onCancel={() => setResetPasswordUser(null)}
                  onConfirm={handleResetPassword}
                  isProcessing={resetPasswordProcessing}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApproval;
