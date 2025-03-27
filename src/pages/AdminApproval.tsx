
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// استيراد المكونات المستخرجة
import UserTable from '@/components/admin/UserTable';
import UserEditForm from '@/components/admin/UserEditForm';
import UserFilters from '@/components/admin/UserFilters';
import UserTabsFilter from '@/components/admin/UserTabsFilter';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog';

// استيراد custom hook
import { useUserManagement } from '@/hooks/useUserManagement';

const AdminApproval = () => {
  const { user, userProfile } = useAuth();
  const {
    users,
    isLoading,
    activeTab,
    filterPlan,
    filterStatus,
    searchQuery,
    isEditingUser,
    editedUserData,
    newPassword,
    showPassword,
    isProcessing,
    selectedDate,
    showConfirmReset,
    userToReset,
    setActiveTab,
    setFilterPlan,
    setFilterStatus,
    setSearchQuery,
    setNewPassword,
    setShowPassword,
    setShowConfirmReset,
    setUserToReset,
    fetchUsers,
    approveUser,
    rejectUser,
    resetUserPassword,
    saveUserData,
    startEditing,
    cancelEditing,
    handleEditChange,
    getFilteredUsers,
    getUserCounts,
    prepareUserPasswordReset,
    handleDateSelect,
  } = useUserManagement();

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    console.log('جاري تحميل صفحة إدارة المستخدمين...');
    
    // تسجيل معلومات المستخدم للتصحيح
    console.log('معلومات المستخدم في AdminApproval:', {
      id: user?.id,
      email: user?.email,
      is_approved: userProfile?.is_approved,
      is_admin: userProfile?.is_admin
    });
    
    fetchUsers();
  }, [user, userProfile]);

  // التعامل مع تأكيد إعادة تعيين كلمة المرور
  const handleConfirmReset = () => {
    if (userToReset && newPassword) {
      resetUserPassword(userToReset, newPassword);
    }
  };

  const userCounts = getUserCounts();
  const filteredUsers = getFilteredUsers();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">إدارة المستخدمين</CardTitle>
                <CardDescription>
                  إدارة حسابات المستخدمين والتحكم الكامل في الصلاحيات والاشتراكات
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUsers} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* أدوات البحث والتصفية */}
            <UserFilters 
              searchQuery={searchQuery}
              filterPlan={filterPlan}
              filterStatus={filterStatus}
              onSearchChange={setSearchQuery}
              onPlanFilterChange={setFilterPlan}
              onStatusFilterChange={setFilterStatus}
            />
            
            <UserTabsFilter
              activeTab={activeTab}
              onTabChange={setActiveTab}
              totalUsers={userCounts.total}
              pendingUsers={userCounts.pending}
              approvedUsers={userCounts.approved}
            >
              {isEditingUser ? (
                <UserEditForm 
                  userData={editedUserData!}
                  newPassword={newPassword}
                  showPassword={showPassword}
                  isProcessing={isProcessing}
                  selectedDate={selectedDate}
                  onCancel={cancelEditing}
                  onSave={saveUserData}
                  onShowPasswordToggle={() => setShowPassword(!showPassword)}
                  onNewPasswordChange={setNewPassword}
                  onUserDataChange={handleEditChange}
                  onDateSelect={handleDateSelect}
                  onPasswordReset={() => prepareUserPasswordReset(editedUserData!.id)}
                />
              ) : (
                <UserTable 
                  users={filteredUsers}
                  isLoading={isLoading}
                  onEdit={startEditing}
                  onApprove={approveUser}
                  onReject={rejectUser}
                />
              )}
            </UserTabsFilter>
          </CardContent>
        </Card>
      </div>
      
      {/* مربع حوار تأكيد إعادة تعيين كلمة المرور */}
      <ResetPasswordDialog 
        isOpen={showConfirmReset}
        onOpenChange={setShowConfirmReset}
        onCancel={() => {
          setUserToReset(null);
          setNewPassword('');
        }}
        onConfirm={handleConfirmReset}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default AdminApproval;
