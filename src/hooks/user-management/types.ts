
import { UserProfile } from '@/types/UserProfile';

// الأنواع المشتركة لإدارة المستخدمين
export interface UserManagementState {
  // حالة المستخدمين والتحميل
  users: UserProfile[];
  isLoading: boolean;
  fetchAttempted: boolean;
  fetchError: string | null;
  
  // حالة التصفية
  activeTab: string;
  filterPlan: string;
  filterStatus: string;
  searchQuery: string;
  
  // حالة تحرير المستخدم
  isEditingUser: string | null;
  editedUserData: UserProfile | null;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  passwordError: string | null;
  isProcessing: boolean;
  selectedDate: Date | undefined;
  
  // حالة إعادة تعيين كلمة المرور
  showConfirmReset: boolean;
  userToReset: string | null;
}

export interface UserManagementActions {
  // عمليات جلب البيانات
  fetchUsers: () => Promise<void>;
  
  // عمليات التصفية
  setActiveTab: (tab: string) => void;
  setFilterPlan: (plan: string) => void;
  setFilterStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  getFilteredUsers: () => UserProfile[];
  getUserCounts: () => { total: number; pending: number; approved: number };
  
  // عمليات المستخدمين
  addNewUser: (
    email: string, 
    password: string, 
    fullName: string, 
    isAdmin?: boolean, 
    isApproved?: boolean,
    subscriptionPlan?: string,
    accountStatus?: string
  ) => Promise<boolean>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  
  // عمليات التحرير
  startEditing: (userData: UserProfile) => void;
  cancelEditing: () => void;
  handleEditChange: (field: string, value: any) => void;
  saveUserData: () => Promise<void>;
  
  // عمليات كلمة المرور
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setShowPassword: (show: boolean) => void;
  setShowConfirmReset: (show: boolean) => void;
  setUserToReset: (userId: string | null) => void;
  setPasswordError: (error: string | null) => void;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;
  prepareUserPasswordReset: (userId: string) => void;
  resetPasswordStates: () => void;
  validatePassword: () => boolean;
  
  // عمليات تحديث البيانات
  updateUserEmail: (userId: string, newEmail: string) => Promise<void>;
  handleDateSelect: (date: Date | undefined) => void;
  
  // المكونات
  ErrorAlert: () => JSX.Element | null;
}

export type UserManagement = UserManagementState & UserManagementActions;
