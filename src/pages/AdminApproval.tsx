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
    <div className="min-h-screen app-background">
      <AppHeader />
      
      <div className="container py-16 mx-auto max-w-7xl px-6"> {/* Increased padding and max width */}
        <div className="dish-container relative space-y-8"> {/* Added more vertical spacing */}
          {/* تأثيرات توهج الخلفية */}
          <div className="dish-glow-top"></div>
          <div className="dish-glow-bottom"></div>
          <div className="dish-inner-shadow"></div>
          <div className="dish-reflection"></div>
          
          {/* الرأس والعنوان */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 p-10 border-b border-[#1e2a47]/30 relative z-10"> {/* Increased padding and gap */}
            <div className="space-y-4"> {/* Added vertical spacing */}
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                نظام إدارة المستخدمين
              </h1>
              <p className="text-lg text-blue-200/70">
                إدارة حسابات المستخدمين والتحكم الكامل في الصلاحيات والاشتراكات
              </p>
            </div>
            <div className="flex items-center gap-4"> {/* Slightly reduced gap */}
              <Button 
                variant="outline"
                className="bg-[#131b31] hover:bg-[#1a253f] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3" // Added padding
                onClick={fetchUsers} 
                disabled={isLoading}
              >
                <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''} mr-3`} /> {/* Increased icon size */}
                تحديث
              </Button>
              <Button 
                className="theme-button-primary shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3" // Added padding
              >
                <PlusCircle className="h-6 w-6 mr-3" /> {/* Increased icon size */}
                إضافة مستخدم
              </Button>
            </div>
          </div>
          
          <div className="p-10 relative z-10 space-y-10"> {/* Increased padding and added vertical spacing */}
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
            
            {/* إحصائيات المستخدمين */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"> {/* Increased gap */}
              <div className="flex items-center justify-between p-6 rounded-xl bg-[#131b31] shadow-lg hover:shadow-xl transition-all duration-300">
                <div>
                  <h3 className="text-base text-blue-200/70 mb-1">المستخدمون</h3>
                  <p className="text-3xl font-bold">{userCounts.total}</p>
                </div>
                <div className="rounded-full p-4 bg-blue-600/20">
                  <User className="h-7 w-7 text-blue-300" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-6 rounded-xl bg-[#131b31] shadow-lg hover:shadow-xl transition-all duration-300">
                <div>
                  <h3 className="text-base text-blue-200/70 mb-1">معتمدون</h3>
                  <p className="text-3xl font-bold">{userCounts.approved}</p>
                </div>
                <div className="rounded-full p-4 bg-emerald-500/20">
                  <CheckCircle className="h-7 w-7 text-emerald-300" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-6 rounded-xl bg-[#131b31] shadow-lg hover:shadow-xl transition-all duration-300">
                <div>
                  <h3 className="text-base text-blue-200/70 mb-1">في الانتظار</h3>
                  <p className="text-3xl font-bold">{userCounts.pending}</p>
                </div>
                <div className="rounded-full p-4 bg-amber-500/20">
                  <Clock className="h-7 w-7 text-amber-300" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-6 rounded-xl bg-[#131b31] shadow-lg hover:shadow-xl transition-all duration-300 col-span-1 md:col-span-2">
                <div className="w-full">
                  <h3 className="text-base text-blue-200/70 mb-3">نشاط المستخدمين</h3>
                  <div className="w-full bg-[#1a2544] rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full" style={{ width: `${(userCounts.approved / Math.max(userCounts.total, 1)) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm mt-3">
                    <span className="text-blue-200/70">{Math.round((userCounts.approved / Math.max(userCounts.total, 1)) * 100)}% معتمد</span>
                    <span className="text-blue-200/70">{Math.round((userCounts.pending / Math.max(userCounts.total, 1)) * 100)}% قيد الانتظار</span>
                  </div>
                </div>
              </div>
            </div>
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
        }}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default AdminApproval;
