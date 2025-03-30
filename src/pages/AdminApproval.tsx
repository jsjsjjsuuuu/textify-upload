
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// استيراد المكونات
import UserTable from '@/components/admin/UserTable';
import UserEditForm from '@/components/admin/UserEditForm';
import UserFilters from '@/components/admin/UserFilters';
import UserTabsFilter from '@/components/admin/UserTabsFilter';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog';
import UserStats from '@/components/admin/UserStats';
import { AdminUserManagementTab } from '@/components/Profile';

// استيراد custom hook
import { useUserManagement } from '@/hooks/useUserManagement';

const AdminApproval = () => {
  const { user, userProfile } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  
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
    if (!fetchAttempted && user && userProfile) {
      fetchUsers();
    }
  }, [user, userProfile, fetchAttempted]);

  // التعامل مع تأكيد إعادة تعيين كلمة المرور
  const handleConfirmReset = () => {
    if (userToReset && newPassword) {
      // طباعة سجل تصحيح لمساعدة في تشخيص المشكلة
      console.log('تنفيذ إعادة تعيين كلمة المرور مع البيانات:', {
        userToReset,
        userToResetType: typeof userToReset,
        userToResetLength: userToReset.length,
        passwordLength: newPassword.length,
        passwordEmpty: !newPassword.trim()
      });
      
      // تنفيذ عملية إعادة تعيين كلمة المرور
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">لوحة تحكم المسؤول</CardTitle>
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
            {/* عرض إحصائيات المستخدمين */}
            <UserStats stats={userStats} />
          </CardContent>
        </Card>
      
        <Card>
          <CardHeader>
            <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="users">قائمة المستخدمين</TabsTrigger>
                <TabsTrigger value="management" className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4" />
                  إضافة و إدارة المستخدمين
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="users" className="mt-0">
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
            </TabsContent>
            
            <TabsContent value="management" className="mt-0">
              <AdminUserManagementTab />
            </TabsContent>
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
