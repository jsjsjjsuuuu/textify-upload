import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
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
    if (isLoading) return; // منع التنفيذ المتعدد إذا كان هناك طلب جاري بالفعل
    
    setIsLoading(true);
    setFetchError(null);
    try {
      console.log('بدء جلب بيانات المستخدمين...');
      setFetchAttempted(true); // تعيين أنه تمت محاولة الجلب على الأقل مرة واحدة
      
      // جلب بيانات الملفات الشخصية أولاً - هذه البيانات متاحة للجميع
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error('خطأ في جلب الملفات الشخصية:', profilesError);
        toast.error('خطأ في جلب بيانات الملفات الشخصية');
        setIsLoading(false);
        setFetchError('فشل في جلب بيانات الملفات الشخصية: ' + profilesError.message);
        return;
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('لم يتم العثور على ملفات شخصية');
        setUsers([]);
        setIsLoading(false);
        return;
      }

      console.log('تم جلب الملفات الشخصية بنجاح، العدد:', profilesData.length);
      
      // محاولة جلب بيانات المستخدمين من خلال الـ RPC - مع معالجة محسنة للأخطاء
      let authUsersData = null;
      let authUsersError = null;
      
      try {
        // محاولة استخدام الدالة المخصصة
        console.log('محاولة استدعاء وظيفة get_users_emails...');
        const result = await supabase.rpc('get_users_emails');
        authUsersData = result.data;
        authUsersError = result.error;
        
        if (authUsersError) {
          console.error('خطأ في استدعاء وظيفة get_users_emails:', authUsersError);
        } else {
          console.log('تم جلب بيانات المستخدمين من get_users_emails بنجاح، العدد:', authUsersData ? authUsersData.length : 0);
        }
      } catch (rpcError) {
        console.error('استثناء أثناء استدعاء get_users_emails:', rpcError);
        authUsersError = { message: 'خطأ في استدعاء دالة جلب البيانات' };
      }
      
      // إنشاء كائن للبحث السريع عن البريد الإلكتروني وتاريخ الإنشاء حسب معرف المستخدم
      const authUsersMap: Record<string, { email: string, created_at: string }> = {};
      
      if (authUsersData && Array.isArray(authUsersData)) {
        authUsersData.forEach((user: { id: string, email: string, created_at: string }) => {
          if (user && user.id) {
            authUsersMap[user.id] = { 
              email: user.email || '',
              created_at: user.created_at || new Date().toISOString()
            };
          }
        });
        console.log('تم إنشاء خريطة بيانات المستخدمين، عدد العناصر:', Object.keys(authUsersMap).length);
      } else if (authUsersError) {
        console.warn('لم يتم جلب بيانات المستخدمين من الدالة، سيتم استخدام البيانات المتاحة فقط.');
        toast.warning('تم جلب بيانات الملفات الشخصية فقط - بعض المعلومات قد تكون غير متاحة');
      }
      
      // تحويل بيانات الملفات الشخصية إلى قائمة المستخدمين
      const usersWithCompleteData = (profilesData || []).map((profile: any) => {
        // استخدام بيانات المستخدم من الخريطة إذا كانت متاحة
        const userData = authUsersMap[profile.id] || { 
          email: profile.username ? `${profile.username}@example.com` : 'user@example.com', 
          created_at: profile.created_at || new Date().toISOString() 
        };
        
        // معالجة is_admin بشكل أكثر دقة - التأكد من أنها قيمة منطقية
        const isAdmin = profile.is_admin === true;
        
        return {
          ...profile,
          id: profile.id,
          email: userData.email,
          is_admin: isAdmin,
          created_at: userData.created_at || profile.created_at,
        };
      });
      
      console.log('معلومات المستخدمين بعد المعالجة:', usersWithCompleteData.length);
      setUsers(usersWithCompleteData);
    } catch (error: any) {
      console.error('خطأ غير متوقع في جلب بيانات المستخدمين:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
      setFetchError(`خطأ غير متوقع: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة مستخدم جديد
  const addNewUser = async (
    email: string, 
    password: string, 
    fullName: string, 
    isAdmin: boolean = false, 
    isApproved: boolean = false,
    subscriptionPlan: string = 'standard',
    accountStatus: string = 'active'
  ) => {
    setIsProcessing(true);
    try {
      console.log('جاري إضافة مستخدم جديد:', { email, fullName, isAdmin, isApproved });
      
      // إنشاء المستخدم من خلال API لـ Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });
      
      if (signUpError) {
        console.error('خطأ في إنشاء المستخدم:', signUpError);
        toast.error(`فشل في إنشاء المستخدم: ${signUpError.message}`);
        return false;
      }
      
      // التأكد من إنشاء المستخدم بنجاح والحصول على معرف المستخدم
      if (!signUpData.user || !signUpData.user.id) {
        console.error('لم يتم إنشاء المستخدم بشكل صحيح');
        toast.error('فشل في إنشاء المستخدم: لم يتم إنشاء المستخدم بشكل صحيح');
        return false;
      }
      
      const userId = signUpData.user.id;
      
      // تحديث الملف الشخصي للمستخدم
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          is_admin: isAdmin,
          is_approved: isApproved,
          subscription_plan: subscriptionPlan,
          account_status: accountStatus
        })
        .eq('id', userId);
      
      if (profileError) {
        console.error('خطأ في تحديث الملف الشخصي للمستخدم:', profileError);
        toast.error(`فشل في تحديث الملف الشخصي: ${profileError.message}`);
        // نستمر على الرغم من وجود خطأ في تحديث الملف الشخصي، لأن المستخدم تم إنشاؤه بالفعل
      }
      
      toast.success('تم إنشاء المستخدم بنجاح');
      
      // إعادة تحميل المستخدمين بعد الإضافة
      await fetchUsers();
      
      return true;
    } catch (error: any) {
      console.error('خطأ غير متوقع في إضافة المستخدم:', error);
      toast.error(`حدث خطأ أثناء إضافة المستخدم: ${error.message || 'خطأ غير معروف'}`);
      return false;
    } finally {
      setIsProcessing(false);
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
      
      // تحديث المستخدم المعني فقط بدلاً من إعادة تحميل كل البيانات
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_approved: true } : user
        )
      );
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
      
      // تحديث المستخدم المعني فقط
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_approved: false } : user
        )
      );
    } catch (error) {
      console.error('خطأ غير متوقع في رفض المستخدم:', error);
      toast.error('حدث خطأ أثناء رفض المستخدم');
    } finally {
      setIsProcessing(false);
    }
  };

  // وظيفة إعادة تعيين كلمة المرور - محسنة ومعاد كتابتها بالكامل
  const resetUserPassword = async (userId: string, newPassword: string) => {
    setIsProcessing(true);
    try {
      console.log('بدء عملية إعادة تعيين كلمة المرور للمستخدم:', userId);
      console.log('طول كلمة المرور الجديدة:', newPassword.length);
      
      if (!newPassword || newPassword.trim() === '') {
        console.error('كلمة المرور فارغة');
        toast.error('كلمة المرور لا يمكن أن تكون فارغة');
        setIsProcessing(false);
        return;
      }
      
      if (!userId) {
        console.error('معرف المستخدم غير موجود');
        toast.error('معرف المستخدم غير صالح');
        setIsProcessing(false);
        return;
      }

      // محاولة استخدام admin_reset_password_by_string_id أولاً
      let success = false;
      
      try {
        console.log('محاولة استخدام admin_reset_password_by_string_id...');
        const { data, error } = await supabase.rpc('admin_reset_password_by_string_id', {
          user_id_str: userId,
          new_password: newPassword
        });
        
        console.log('نتيجة استدعاء admin_reset_password_by_string_id:', { 
          data, 
          error: error ? { message: error.message, code: error.code } : null 
        });
        
        if (error) {
          console.warn('لم ينجح admin_reset_password_by_string_id، جاري تجربة الطريقة البديلة...');
        } else if (data === true) {
          console.log('تم تغيير كلمة المرور بنجاح باستخدام admin_reset_password_by_string_id');
          success = true;
        }
      } catch (error1) {
        console.error('خطأ في استدعاء admin_reset_password_by_string_id:', error1);
      }
      
      // إذا لم تنجح الطريقة الأولى، جرب الطريقة الثانية
      if (!success) {
        try {
          console.log('محاولة استخدام admin_update_user_password...');
          const { data, error } = await supabase.rpc('admin_update_user_password', {
            user_id: userId,
            new_password: newPassword
          });
          
          console.log('نتيجة استدعاء admin_update_user_password:', { 
            data, 
            error: error ? { message: error.message, code: error.code } : null 
          });
          
          if (error) {
            throw error;
          } else if (data === true) {
            console.log('تم تغيير كلمة المرور بنجاح باستخدام admin_update_user_password');
            success = true;
          }
        } catch (error2) {
          console.error('خطأ في استدعاء admin_update_user_password:', error2);
          throw error2;
        }
      }
      
      // إذا نجحت أي من الطريقتين
      if (success) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        resetPasswordStates();
        return;
      } else {
        throw new Error('فشلت جميع محاولات إعادة تعيين كلمة المرور');
      }
    } catch (error: any) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error);
      toast.error(`حدث خطأ أثناء إعادة تعيين كلمة المرور: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsProcessing(false);
      setShowConfirmReset(false);
      setUserToReset(null);
    }
  };
  
  // وظيفة إعادة تعيين حالات كلمة المرور
  const resetPasswordStates = () => {
    setNewPassword('');
    setShowPassword(false);
    setShowConfirmReset(false);
    setUserToReset(null);
  };

  // وظيفة تغيير البريد الإلكتروني للمستخدم
  const updateUserEmail = async (userId: string, newEmail: string) => {
    setIsProcessing(true);
    try {
      console.log('جاري تغيير البريد الإلكتروني للمستخدم:', userId, newEmail);
      
      // استدعاء وظيفة قاعدة البيانات المخصصة لتغيير البريد الإلكتروني
      const { data, error } = await supabase.rpc('admin_update_user_email', {
        user_id: userId,
        new_email: newEmail
      });
      
      if (error) {
        console.error('خطأ في تغيير البريد الإلكتروني:', error);
        toast.error('فشل في تغيير البريد الإلكتروني: ' + error.message);
        return;
      }
      
      if (data === true) {
        toast.success('تم تغيير البريد الإلكتروني بنجاح');
        
        // تحديث البريد الإلكتروني في قائمة المستخدمين المحلية
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, email: newEmail } : user
          )
        );
        
        // تحديث بيانات المستخدم المعدّل إذا كان مفتوحاً
        if (editedUserData && editedUserData.id === userId) {
          setEditedUserData({
            ...editedUserData,
            email: newEmail
          });
        }
      } else {
        toast.error('لم يتم العثور على المستخدم أو البريد الإلكتروني مستخدم بالفعل');
      }
    } catch (error) {
      console.error('خطأ غير متوقع في تغيير البريد الإلكتروني:', error);
      toast.error('حدث خطأ أثناء تغيير البريد الإلكتروني');
    } finally {
      setIsProcessing(false);
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
      
      // تحديث المستخدم في حالة المستخدمين المحلية
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editedUserData.id ? { ...user, ...editedUserData } : user
        )
      );
      
      // إعادة تعيين حالة التحرير
      setIsEditingUser(null);
      setEditedUserData(null);
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
    if (!newPassword || newPassword.trim() === '') {
      toast.error('يرجى إدخال كلمة المرور الجديدة أولاً');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    console.log('إعداد إعادة تعيين كلمة المرور للمستخدم:', userId);
    setUserToReset(userId);
    setShowConfirmReset(true);
  };

  // التعامل مع تحديد التاريخ
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (editedUserData) {
      handleEditChange('subscription_end_date', date?.toISOString());
    }
  };

  // وظيفة إضافة مكون تنبيه لعرض رسالة الخطأ
  const ErrorAlert = () => {
    if (!fetchError) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>خطأ في جلب البيانات</AlertTitle>
        <AlertDescription>{fetchError}</AlertDescription>
      </Alert>
    );
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
    fetchAttempted,
    fetchError,
    setActiveTab,
    setFilterPlan,
    setFilterStatus,
    setSearchQuery,
    setNewPassword,
    setShowPassword,
    setShowConfirmReset,
    setUserToReset,
    fetchUsers,
    addNewUser,
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
    resetPasswordStates,
    ErrorAlert,
  };
};
