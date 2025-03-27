
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';

interface AuthUserData {
  id: string;
  email: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // حالة تعديل المستخدم
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null);
  const [editedUserData, setEditedUserData] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [userToReset, setUserToReset] = useState<string | null>(null);

  // جلب قائمة المستخدمين
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // جلب بيانات الملفات الشخصية
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        toast.error('خطأ في جلب بيانات الملفات الشخصية');
        console.error('Profiles error:', profilesError);
        return;
      }
      
      // جلب بيانات المستخدمين من خلال الدالة المخصصة get_users_emails
      const { data: authUsersData, error: authUsersError } = await supabase.rpc('get_users_emails');
      
      if (authUsersError) {
        console.error('Auth users error:', authUsersError);
        toast.error('خطأ في جلب بيانات المستخدمين');
        // نستمر بالعمل مع البيانات المتاحة من الملفات الشخصية فقط
      }
      
      // إنشاء كائن للبحث السريع عن البريد الإلكتروني حسب معرف المستخدم
      const emailsMap: Record<string, string> = {};
      if (authUsersData) {
        authUsersData.forEach((user: AuthUserData) => {
          emailsMap[user.id] = user.email;
        });
      }
      
      // تحويل بيانات الملفات الشخصية إلى قائمة المستخدمين
      const usersWithEmails = (profilesData || []).map((profile: any) => {
        const email = emailsMap[profile.id];
        
        return {
          id: profile.id,
          email: email || (profile.username ? `${profile.username}@example.com` : 'unknown@example.com'),
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || '',
          is_approved: profile.is_approved || false,
          created_at: profile.created_at,
          subscription_plan: profile.subscription_plan || 'standard',
          account_status: profile.account_status || 'active',
          subscription_end_date: profile.subscription_end_date || null,
        };
      });
      
      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // وظيفة الموافقة على مستخدم
  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);
      
      if (error) {
        toast.error('فشل في الموافقة على المستخدم');
        return;
      }
      
      toast.success('تمت الموافقة على المستخدم بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('حدث خطأ أثناء الموافقة على المستخدم');
    }
  };

  // وظيفة رفض مستخدم
  const rejectUser = async (userId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', userId);
      
      if (updateError) {
        toast.error('فشل في رفض المستخدم');
        return;
      }
      
      toast.success('تم رفض المستخدم بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('حدث خطأ أثناء رفض المستخدم');
    }
  };

  // وظيفة إعادة تعيين كلمة المرور
  const resetUserPassword = async (userId: string, newPassword: string) => {
    setIsProcessing(true);
    try {
      // استدعاء وظيفة قاعدة البيانات المخصصة لتغيير كلمة المرور
      const { data, error } = await supabase.rpc('admin_update_user_password', {
        user_id: userId,
        new_password: newPassword
      });
      
      if (error) {
        toast.error('فشل في إعادة تعيين كلمة المرور');
        console.error('Reset password error:', error);
        return;
      }
      
      if (data) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        setNewPassword('');
        setShowPassword(false);
      } else {
        toast.error('لم يتم العثور على المستخدم');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsProcessing(false);
      setShowConfirmReset(false);
      setUserToReset(null);
    }
  };

  // وظيفة تحديث بيانات المستخدم بالكامل
  const saveUserData = async () => {
    if (!editedUserData) return;
    
    setIsProcessing(true);
    try {
      // تحديث بيانات الملف الشخصي
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editedUserData.full_name,
          is_approved: editedUserData.is_approved,
          subscription_plan: editedUserData.subscription_plan,
          account_status: editedUserData.account_status,
          subscription_end_date: editedUserData.subscription_end_date
        })
        .eq('id', editedUserData.id);
      
      if (profileError) {
        toast.error('فشل في تحديث بيانات المستخدم');
        console.error('Profile update error:', profileError);
        return;
      }
      
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      
      // إعادة تعيين حالة التحرير
      setIsEditingUser(null);
      setEditedUserData(null);
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error('حدث خطأ أثناء حفظ بيانات المستخدم');
    } finally {
      setIsProcessing(false);
    }
  };

  // وظيفة بدء تحرير بيانات المستخدم
  const startEditing = (userData: UserProfile) => {
    setIsEditingUser(userData.id);
    setEditedUserData({...userData});
    if (userData.subscription_end_date) {
      setSelectedDate(new Date(userData.subscription_end_date));
    } else {
      setSelectedDate(undefined);
    }
  };

  // وظيفة إلغاء التحرير
  const cancelEditing = () => {
    setIsEditingUser(null);
    setEditedUserData(null);
    setSelectedDate(undefined);
  };

  // تحديث بيانات المستخدم أثناء التحرير
  const handleEditChange = (field: string, value: any) => {
    if (editedUserData) {
      setEditedUserData({
        ...editedUserData,
        [field]: value
      });
    }
  };

  // تصفية المستخدمين حسب الحالة
  const filterUsersByTab = (users: UserProfile[]) => {
    switch (activeTab) {
      case 'pending':
        return users.filter(user => !user.is_approved);
      case 'approved':
        return users.filter(user => user.is_approved);
      case 'all':
      default:
        return users;
    }
  };

  // تصفية المستخدمين حسب نوع الباقة
  const filterUsersByPlan = (users: UserProfile[]) => {
    if (filterPlan === 'all') return users;
    return users.filter(user => user.subscription_plan === filterPlan);
  };

  // تصفية المستخدمين حسب حالة الحساب
  const filterUsersByStatus = (users: UserProfile[]) => {
    if (filterStatus === 'all') return users;
    return users.filter(user => user.account_status === filterStatus);
  };

  // البحث عن المستخدمين
  const searchUsers = (users: UserProfile[]) => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      (user.full_name && user.full_name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  };

  // تطبيق جميع الفلاتر
  const getFilteredUsers = () => {
    let filteredUsers = [...users];
    filteredUsers = filterUsersByTab(filteredUsers);
    filteredUsers = filterUsersByPlan(filteredUsers);
    filteredUsers = filterUsersByStatus(filteredUsers);
    filteredUsers = searchUsers(filteredUsers);
    return filteredUsers;
  };

  // عدد المستخدمين في كل فئة
  const getUserCounts = () => {
    return {
      total: users.length,
      pending: users.filter(u => !u.is_approved).length,
      approved: users.filter(u => u.is_approved).length
    };
  };

  // إعداد المستخدم لإعادة تعيين كلمة المرور
  const prepareUserPasswordReset = (userId: string) => {
    if (newPassword) {
      setUserToReset(userId);
      setShowConfirmReset(true);
    } else {
      toast.error('يرجى إدخال كلمة المرور الجديدة');
    }
  };

  // التعامل مع تحديد التاريخ
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (editedUserData) {
      handleEditChange('subscription_end_date', date?.toISOString());
    }
  };

  return {
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
  };
};
