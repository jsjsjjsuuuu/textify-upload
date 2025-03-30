
import { UserProfile } from '@/types/UserProfile';
import { useFetchUsers } from './user-management/useFetchUsers';
import { useUserFilters } from './user-management/useUserFilters';
import { useUserEditor } from './user-management/useUserEditor';
import { usePasswordManagement } from './user-management/usePasswordManagement';
import { useUserOperations } from './user-management/useUserOperations';
import { UserManagement } from './user-management/types';

export const useUserManagement = (): UserManagement => {
  // استدعاء الخطافات الفرعية
  const { 
    users, 
    setUsers, 
    isLoading, 
    fetchAttempted, 
    fetchError, 
    fetchUsers, 
    ErrorAlert 
  } = useFetchUsers();

  const { 
    activeTab, 
    filterPlan, 
    filterStatus, 
    searchQuery, 
    setActiveTab, 
    setFilterPlan, 
    setFilterStatus, 
    setSearchQuery, 
    getFilteredUsers, 
    getUserCounts 
  } = useUserFilters(users);

  const { 
    isEditingUser, 
    editedUserData, 
    selectedDate, 
    isProcessing: editorProcessing, 
    startEditing, 
    cancelEditing, 
    handleEditChange, 
    handleDateSelect, 
    saveUserData, 
    updateUserEmail 
  } = useUserEditor(users, setUsers);

  const { 
    newPassword, 
    confirmPassword,
    showPassword, 
    showConfirmReset, 
    userToReset, 
    isProcessing: passwordProcessing, 
    passwordError,
    setNewPassword, 
    setConfirmPassword,
    setShowPassword, 
    setShowConfirmReset, 
    setUserToReset, 
    setPasswordError,
    resetPasswordStates, 
    prepareUserPasswordReset, 
    resetUserPassword,
    validatePassword
  } = usePasswordManagement();

  const { 
    isProcessing: operationsProcessing, 
    addNewUser, 
    approveUser, 
    rejectUser 
  } = useUserOperations(users, setUsers, fetchUsers);

  // توحيد حالة المعالجة من جميع الخطافات
  const isProcessing = editorProcessing || passwordProcessing || operationsProcessing;

  // تجميع كل الوظائف والحالات من الوحدات الفرعية
  return {
    // حالة المستخدمين والتحميل
    users,
    isLoading,
    fetchAttempted,
    fetchError,
    
    // حالة التصفية
    activeTab,
    filterPlan,
    filterStatus,
    searchQuery,
    
    // حالة تحرير المستخدم
    isEditingUser,
    editedUserData,
    newPassword,
    confirmPassword,
    showPassword,
    passwordError,
    isProcessing,
    selectedDate,
    
    // حالة إعادة تعيين كلمة المرور
    showConfirmReset,
    userToReset,
    
    // وظائف التحكم بالحالة
    setActiveTab,
    setFilterPlan,
    setFilterStatus,
    setSearchQuery,
    setNewPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmReset,
    setUserToReset,
    setPasswordError,
    
    // وظائف المستخدمين
    fetchUsers,
    addNewUser,
    approveUser,
    rejectUser,
    resetUserPassword, // نوع الإرجاع متوافق الآن مع التعريف في types.ts
    updateUserEmail,
    saveUserData,
    startEditing,
    cancelEditing,
    handleEditChange,
    getFilteredUsers,
    getUserCounts,
    prepareUserPasswordReset,
    handleDateSelect,
    resetPasswordStates,
    validatePassword,
    
    // مكونات
    ErrorAlert,
  };
};
