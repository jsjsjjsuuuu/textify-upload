
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

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
    fetchAttempted,
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
    updateUserEmail,
    saveUserData,
    startEditing,
    cancelEditing,
    handleEditChange,
    getFilteredUsers,
    getUserCounts,
    prepareUserPasswordReset,
    handleDateSelect,
  } = useUserManagement();

  useEffect(() => {
    console.log('جاري تحميل صفحة إدارة المستخدمين...', { fetchAttempted });
    
    // تسجيل معلومات المستخدم للتصحيح
    console.log('معلومات المستخدم في AdminApproval:', {
      id: user?.id,
      email: user?.email,
      is_approved: userProfile?.is_approved,
      is_admin: userProfile?.is_admin
    });
    
    // جلب البيانات فقط إذا لم تتم محاولة الجلب من قبل أو إذا كانت قائمة المستخدمين فارغة
    if (!fetchAttempted && user && userProfile) {
      fetchUsers();
    }
  }, [user, userProfile, fetchAttempted, fetchUsers]);

  const userCounts = getUserCounts();
  const filteredUsers = getFilteredUsers();

  return (
    <div className="min-h-screen app-background bg-[#070b17] pb-16">
      <AppHeader />
      
      <div className="container py-16 mx-auto px-6"> 
        <div className="dish-container rounded-2xl shadow-2xl"> 
          <div className="dish-glow-top"></div>
          <div className="dish-glow-bottom"></div>
          
          {/* رأس الصفحة مع العنوان والأزرار */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 border-b border-[#1e2a47]/30 bg-[#0a0f1d]/95">
            <div className="space-y-2 text-right mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gradient">
                نظام إدارة المستخدمين
              </h1>
              <p className="text-sm text-blue-200/70">
                إدارة حسابات المستخدمين والتحكم الكامل في الصلاحيات والاشتراكات
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                size="sm"
                className="admin-button admin-button-secondary" 
                onClick={fetchUsers} 
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ml-2`} />
                تحديث
              </Button>
              <Button 
                size="sm"
                className="admin-button admin-button-primary"
              >
                <PlusCircle className="h-4 w-4 ml-2" />
                إضافة مستخدم
              </Button>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {/* أدوات البحث والتصفية */}
            <UserFilters 
              searchQuery={searchQuery}
              filterPlan={filterPlan}
              filterStatus={filterStatus}
              onSearchChange={setSearchQuery}
              onPlanFilterChange={setFilterPlan}
              onStatusFilterChange={setFilterStatus}
            />
            
            {/* علامات التبويب للتصفية */}
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
                  onEmailChange={updateUserEmail}
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
          </div>
        </div>
      </div>
      
      {/* مربع حوار تأكيد إعادة تعيين كلمة المرور */}
      <ResetPasswordDialog 
        isOpen={showConfirmReset}
        onOpenChange={setShowConfirmReset}
        onCancel={() => {
          setUserToReset(null);
          setNewPassword('');
        }}
        onConfirm={() => {
          if (userToReset && newPassword) {
            console.log('تنفيذ إعادة تعيين كلمة المرور مع البيانات:', {
              userToReset,
              userToResetType: typeof userToReset,
              userToResetLength: userToReset.length,
              passwordLength: newPassword.length,
              passwordEmpty: !newPassword.trim()
            });
            
            resetUserPassword(userToReset, newPassword);
          } else {
            console.error('لا يمكن إعادة تعيين كلمة المرور:', {
              userToReset,
              hasPassword: !!newPassword,
              passwordLength: newPassword ? newPassword.length : 0
            });
            
            if (!userToReset) {
              toast.error('لم يتم تحديد مستخدم لإعادة تعيين كلمة المرور');
            }
            
            if (!newPassword) {
              toast.error('يرجى إدخال كلمة المرور الجديدة');
            }
          }
        }}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default AdminApproval;
