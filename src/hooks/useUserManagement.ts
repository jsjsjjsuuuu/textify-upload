
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';

interface AuthUserData {
  id: string;
  email: string;
  created_at: string;
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
      console.log('بدء جلب بيانات المستخدمين...');
      
      // جلب بيانات الملفات الشخصية
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error('خطأ في جلب الملفات الشخصية:', profilesError);
        toast.error('خطأ في جلب بيانات الملفات الشخصية');
        setIsLoading(false);
        return;
      }
      
      console.log('تم جلب الملفات الشخصية:', profilesData?.length || 0);
      console.log('عينة من بيانات الملفات الشخصية:', profilesData?.[0]);
      
      // جلب بيانات المستخدمين من خلال الدالة المخصصة get_users_emails
      const { data: authUsersData, error: authUsersError } = await supabase.rpc('get_users_emails');
      
      if (authUsersError) {
        console.error('خطأ في جلب بيانات المستخدمين الأساسية:', authUsersError);
        toast.error('خطأ في جلب بيانات المستخدمين');
        
        // في حالة فشل جلب البيانات من الدالة، نستمر باستخدام البيانات الموجودة في الملفات الشخصية فقط
        if (!profilesData || profilesData.length === 0) {
          setIsLoading(false);
          return;
        }
      }
      
      console.log('تم جلب بيانات المستخدمين الأساسية:', authUsersData);
      
      // إنشاء كائن للبحث السريع عن البريد الإلكتروني وتاريخ الإنشاء حسب معرف المستخدم
      const authUsersMap: Record<string, { email: string, created_at: string }> = {};
      if (authUsersData && Array.isArray(authUsersData)) {
        authUsersData.forEach((user: AuthUserData) => {
          if (user && user.id) {
            authUsersMap[user.id] = { 
              email: user.email || '',
              created_at: user.created_at || new Date().toISOString()
            };
          }
        });
      }
      
      console.log('تم إنشاء خريطة بيانات المستخدمين:', Object.keys(authUsersMap).length);
      
      // تحويل بيانات الملفات الشخصية إلى قائمة المستخدمين
      const usersWithCompleteData = (profilesData || []).map((profile: any) => {
        const userData = authUsersMap[profile.id] || { email: '', created_at: profile.created_at || new Date().toISOString() };
        
        // قبل التحويل (للتصحيح)
        console.log('معلومات ملف المستخدم:', {
          id: profile.id,
          is_admin_raw: profile.is_admin,
          is_admin_type: typeof profile.is_admin
        });
        
        // التحويل إلى قيمة منطقية صريحة
        const isAdmin = profile.is_admin === true;
        
        return {
          id: profile.id,
          email: userData.email,
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || '',
          is_approved: profile.is_approved || false,
          is_admin: isAdmin, // تأكد من أن القيمة منطقية دائمًا
          created_at: userData.created_at || profile.created_at,
          subscription_plan: profile.subscription_plan || 'standard',
          account_status: profile.account_status || 'active',
          subscription_end_date: profile.subscription_end_date || null,
          username: profile.username || '',
        };
      });
      
      console.log('تم إنشاء قائمة المستخدمين النهائية:', usersWithCompleteData.length);
      // تصحيح - طباعة بعض البيانات للتحقق
      if (usersWithCompleteData.length > 0) {
        console.log('عينة من بيانات المستخدم النهائية:', {
          first_user: usersWithCompleteData[0],
          is_admin_value: usersWithCompleteData[0].is_admin,
          is_admin_type: typeof usersWithCompleteData[0].is_admin
        });
      }
      
      setUsers(usersWithCompleteData);
      
    } catch (error) {
      console.error('خطأ غير متوقع أثناء جلب بيانات المستخدمين:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // وظيفة الموافقة على مستخدم
  const approveUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      console.log('جاري الموافقة على المستخدم:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);
      
      if (error) {
        console.error('خطأ في الموافقة على المستخدم:', error);
        toast.error('فشل في الموافقة على المستخدم');
        return;
      }
      
      toast.success('تمت الموافقة على المستخدم بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('خطأ غير متوقع في الموافقة على المستخدم:', error);
      toast.error('حدث خطأ أثناء الموافقة على المستخدم');
    } finally {
      setIsProcessing(false);
    }
  };

  // وظيفة رفض مستخدم
  const rejectUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      console.log('جاري رفض المستخدم:', userId);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', userId);
      
      if (updateError) {
        console.error('خطأ في رفض المستخدم:', updateError);
        toast.error('فشل في رفض المستخدم');
        return;
      }
      
      toast.success('تم رفض المستخدم بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('خطأ غير متوقع في رفض المستخدم:', error);
      toast.error('حدث خطأ أثناء رفض المستخدم');
    } finally {
      setIsProcessing(false);
    }
  };

  // وظيفة إعادة تعيين كلمة المرور
  const resetUserPassword = async (userId: string, newPassword: string) => {
    setIsProcessing(true);
    try {
      console.log('جاري إعادة تعيين كلمة المرور للمستخدم:', userId);
      
      // استدعاء وظيفة قاعدة البيانات المخصصة لتغيير كلمة المرور
      const { data, error } = await supabase.rpc('admin_update_user_password', {
        user_id: userId,
        new_password: newPassword
      });
      
      if (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        toast.error('فشل في إعادة تعيين كلمة المرور: ' + error.message);
        return;
      }
      
      if (data === true) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        setNewPassword('');
        setShowPassword(false);
      } else {
        toast.error('لم يتم العثور على المستخدم أو حدث خطأ آخر');
      }
    } catch (error) {
      console.error('خطأ غير متوقع في إعادة تعيين كلمة المرور:', error);
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
      console.log('جاري حفظ بيانات المستخدم:', editedUserData.id);
      
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
        console.error('خطأ في تحديث بيانات المستخدم:', profileError);
        toast.error('فشل في تحديث بيانات المستخدم: ' + profileError.message);
        return;
      }
      
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      
      // إعادة تعيين حالة التحرير
      setIsEditingUser(null);
      setEditedUserData(null);
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('خطأ غير متوقع في حفظ بيانات المستخدم:', error);
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
  };
};

