
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchAttempted, setFetchAttempted] = useState(false);
  
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
  const fetchUsers = useCallback(async () => {
    if (isLoading) return; // منع التنفيذ المتعدد إذا كان هناك طلب جاري بالفعل
    
    setIsLoading(true);
    try {
      console.log('بدء جلب بيانات المستخدمين...');
      setFetchAttempted(true); // تعيين أنه تمت محاولة الجلب على الأقل مرة واحدة
      
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
      }
      
      // تحويل بيانات الملفات الشخصية إلى قائمة المستخدمين
      const usersWithCompleteData = (profilesData || []).map((profile: any) => {
        const userData = authUsersMap[profile.id] || { email: '', created_at: profile.created_at || new Date().toISOString() };
        
        // معالجة is_admin بشكل أكثر دقة - التأكد من أنها قيمة منطقية
        const isAdmin = profile.is_admin === true;
        
        return {
          ...profile,
          id: profile.id,
          email: userData.email,
          is_admin: isAdmin, // التأكد من أن القيمة منطقية
          created_at: userData.created_at || profile.created_at,
        };
      });
      
      console.log('معلومات المستخدمين بعد المعالجة:', usersWithCompleteData.map(user => ({
        id: user.id,
        is_admin: user.is_admin,
        is_admin_type: typeof user.is_admin
      })));
      
      setUsers(usersWithCompleteData);
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

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

      // التحقق من صحة تنسيق UUID
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = uuidPattern.test(userId);
      
      console.log('التحقق من تنسيق UUID:', {
        userId,
        isValidUuid,
        passwordLength: newPassword.length
      });

      // استدعاء وظيفة إعادة تعيين كلمة المرور مباشرة
      const { data, error } = await supabase.functions.invoke('admin_reset_password', {
        body: {
          user_id: userId,
          new_password: newPassword
        }
      });
      
      console.log('نتيجة استدعاء admin_reset_password:', { 
        data, 
        error: error ? { message: error.message, code: error.code } : null 
      });
      
      if (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        toast.error(`فشل في إعادة تعيين كلمة المرور: ${error.message}`);
        
        // محاولة استخدام طريقة بديلة إذا كان معرف المستخدم صالحًا
        if (isValidUuid) {
          console.log('المحاولة باستخدام الطريقة البديلة admin_update_password');
          
          const { data: traditionalData, error: traditionalError } = await supabase.functions.invoke('admin_update_password', {
            body: {
              user_id: userId,
              password: newPassword
            }
          });
          
          console.log('نتيجة استدعاء admin_update_password:', { 
            data: traditionalData, 
            error: traditionalError ? { message: traditionalError.message, code: traditionalError.code } : null 
          });
          
          if (traditionalError) {
            throw traditionalError;
          }
          
          if (traditionalData === true) {
            console.log('تم تغيير كلمة المرور بنجاح (طريقة تقليدية)');
            toast.success('تم إعادة تعيين كلمة المرور بنجاح');
            resetPasswordStates();
            return;
          } else {
            throw new Error('لم يتم العثور على المستخدم أو حدث خطأ آخر');
          }
        } else {
          throw new Error('معرف المستخدم ليس بتنسيق UUID صالح');
        }
      } else {
        // نجحت الطريقة المباشرة
        if (data === true) {
          console.log('تم تغيير كلمة المرور بنجاح');
          toast.success('تم إعادة تعيين كلمة المرور بنجاح');
          resetPasswordStates();
          return;
        } else {
          console.error('لم يتم إعادة تعيين كلمة المرور، البيانات غير متوقعة:', data);
          toast.error('لم يتم العثور على المستخدم أو حدث خطأ آخر');
        }
      }
    } catch (error: any) {
      console.error('خطأ غير متوقع في إعادة تعيين كلمة المرور:', error);
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
  const getFilteredUsers = useCallback(() => {
    let filteredUsers = [...(users || [])]; // التأكد من أن المصفوفة موجودة
    if (users && users.length > 0) {
      filteredUsers = filterUsersByTab(filteredUsers);
      filteredUsers = filterUsersByPlan(filteredUsers);
      filteredUsers = filterUsersByStatus(filteredUsers);
      filteredUsers = searchUsers(filteredUsers);
    }
    return filteredUsers;
  }, [users, activeTab, filterPlan, filterStatus, searchQuery]);

  // عدد المستخدمين في كل فئة
  const getUserCounts = useCallback(() => {
    if (!users || users.length === 0) {
      return {
        total: 0,
        pending: 0,
        approved: 0
      };
    }
    
    return {
      total: users.length,
      pending: users.filter(u => !u.is_approved).length,
      approved: users.filter(u => u.is_approved).length
    };
  }, [users]);

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
    resetPasswordStates,
  };
};
