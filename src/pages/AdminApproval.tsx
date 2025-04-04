
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { AdminUserManagementTab } from '@/components/Profile';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog';
import UserStats from '@/components/admin/UserStats';
import { useUserManagement } from '@/hooks/useUserManagement';
import { toast } from 'sonner';

// استيراد المكونات الجديدة
import AdminHeader from '@/components/admin/AdminHeader';
import AdminTabs from '@/components/admin/AdminTabs';
import UserManagementPanel from '@/components/admin/UserManagementPanel';

const AdminApproval = () => {
  const { user, userProfile } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = React.useState('users');
  
  const {
    users,
    detailedUsers,
    isLoading,
    isLoadingDetails,
    activeTab,
    filterPlan,
    filterStatus,
    searchQuery,
    isEditingUser,
    editedUserData,
    showPassword,
    isProcessing,
    selectedDate,
    showConfirmReset,
    userToReset,
    newPassword,
    confirmPassword,
    passwordError,
    fetchAttempted,
    fetchError,
    setActiveTab,
    setFilterPlan,
    setFilterStatus,
    setSearchQuery,
    setShowPassword,
    setShowConfirmReset,
    setUserToReset,
    setNewPassword,
    setConfirmPassword,
    setPasswordError,
    fetchUsers,
    fetchUserDetails,
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
    validatePassword,
    ErrorAlert,
  } = useUserManagement();

  // جلب البيانات عند تحميل الصفحة - مع منع التكرار
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
    if (!fetchAttempted || users.length === 0) {
      fetchUsers();
    }
  }, [user, userProfile, fetchAttempted, users.length, fetchUsers]);

  // التعامل مع تأكيد إعادة تعيين كلمة المرور - تحسين التصحيح والتعامل مع الأخطاء
  const handleConfirmReset = () => {
    if (!userToReset) {
      console.error('لا يمكن إعادة تعيين كلمة المرور: معرف المستخدم غير محدد');
      toast.error('لم يتم تحديد مستخدم لإعادة تعيين كلمة المرور');
      return;
    }
    
    // التحقق من كلمة المرور قبل إعادة التعيين
    if (validatePassword()) {
      console.log('تنفيذ إعادة تعيين كلمة المرور للمستخدم:', {
        userToReset,
        passwordLength: newPassword.length
      });
      
      // تعديل التعامل مع النتيجة المرجعة من resetUserPassword
      resetUserPassword(userToReset, newPassword)
        .then(success => {
          if (!success) {
            console.error('فشلت عملية إعادة تعيين كلمة المرور');
            toast.error('فشلت عملية إعادة تعيين كلمة المرور');
          }
        });
    } else {
      console.error('كلمة المرور غير صالحة:', {
        passwordError
      });
      toast.error(passwordError || 'كلمة المرور غير صالحة');
    }
  };

  const userCounts = getUserCounts();
  const filteredUsers = getFilteredUsers();

  // إحصائيات إضافية للمستخدمين
  const userStats = {
    ...userCounts,
    active: users.filter(u => u.account_status === 'active').length,
    suspended: users.filter(u => u.account_status === 'suspended').length,
    expired: users.filter(u => u.account_status === 'expired').length,
    standard: users.filter(u => u.subscription_plan === 'standard').length,
    vip: users.filter(u => u.subscription_plan === 'vip').length,
    pro: users.filter(u => u.subscription_plan === 'pro').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-6">
        <Card className="mb-6">
          <CardHeader>
            <AdminHeader onRefresh={fetchUsers} isLoading={isLoading} />
          </CardHeader>
          <CardContent>
            {/* عرض رسالة الخطأ إذا كان هناك خطأ في جلب البيانات */}
            <ErrorAlert />
            
            {/* عرض إحصائيات المستخدمين */}
            <UserStats stats={userStats} />
          </CardContent>
        </Card>
      
        <Card>
          <CardHeader>
            <AdminTabs 
              activeTab={activeAdminTab} 
              onTabChange={setActiveAdminTab}
              managementTabContent={<AdminUserManagementTab />}
            >
              <UserManagementPanel 
                searchQuery={searchQuery}
                filterPlan={filterPlan}
                filterStatus={filterStatus}
                activeTab={activeTab}
                isEditingUser={isEditingUser}
                editedUserData={editedUserData}
                isProcessing={isProcessing}
                selectedDate={selectedDate}
                userCounts={userCounts}
                filteredUsers={filteredUsers}
                isLoading={isLoading}
                isLoadingDetails={isLoadingDetails}
                detailedUsers={detailedUsers}
                onSearchChange={setSearchQuery}
                onPlanFilterChange={setFilterPlan}
                onStatusFilterChange={setFilterStatus}
                onTabChange={setActiveTab}
                onEdit={startEditing}
                onApprove={approveUser}
                onReject={rejectUser}
                onCancel={cancelEditing}
                onSave={saveUserData}
                onUserDataChange={handleEditChange}
                onDateSelect={handleDateSelect}
                onEmailChange={updateUserEmail}
                onFetchDetails={fetchUserDetails}
              />
            </AdminTabs>
          </CardHeader>
        </Card>
      </div>
      
      {/* مربع حوار تأكيد إعادة تعيين كلمة المرور */}
      <ResetPasswordDialog 
        isOpen={showConfirmReset}
        onOpenChange={setShowConfirmReset}
        onCancel={() => {
          setUserToReset(null);
        }}
        onConfirm={handleConfirmReset}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default AdminApproval;
