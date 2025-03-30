import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import React from 'react';

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
      
      // محاولة جلب بيانات المستخدمين - استخدام محاولات متعددة مع آلية احتياطية
      let authUsersData = null;
      let authUsersError = null;
      
      try {
        // الطريقة 1: استخدام وظيفة RPC المخصصة
        console.log('محاولة 1: استدعاء وظيفة get_users_emails...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_emails');
        
        if (rpcError) {
          console.warn('خطأ في استدعاء get_users_emails:', rpcError);
          throw rpcError; // نقل إلى المحاولة التالية
        }
        
        if (rpcData && Array.isArray(rpcData)) {
          console.log('تم جلب البيانات بنجاح من get_users_emails، العدد:', rpcData.length);
          authUsersData = rpcData;
        } else {
          throw new Error('بيانات غير صالحة من get_users_emails');
        }
      } catch (firstMethodError) {
        console.warn('فشلت المحاولة الأولى، جاري تجربة طريقة بديلة...');
        
        try {
          // الطريقة 2: استخدام استعلام مباشر إلى جدول auth.users إذا كان لديك امتيازات الإدارة
          console.log('محاولة 2: استخدام طريقة بديلة للحصول على بيانات المستخدمين...');
          
          // هذا الاستعلام سيعمل فقط للمستخدمين المشرفين
          const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('id, is_admin')
            .eq('id', (await supabase.auth.getUser()).data.user?.id);
          
          const isAdmin = adminData && adminData.length > 0 && adminData[0].is_admin;
          
          if (isAdmin) {
            // محاولة استدعاء دالة أخرى مخصصة للمشرفين
            const { data: adminUsersData, error: adminUsersError } = await supabase
              .rpc('admin_get_users_with_email');
            
            if (!adminUsersError && adminUsersData) {
              authUsersData = adminUsersData;
              console.log('تم جلب البيانات بنجاح باستخدام امتيازات المشرف');
            } else {
              authUsersError = adminUsersError;
              console.warn('فشل استدعاء admin_get_users_with_email:', adminUsersError);
            }
          } else {
            console.warn('المستخدم ليس مشرفًا، لا يمكن استخدام طريقة المشرف');
          }
        } catch (secondMethodError) {
          console.warn('فشلت المحاولة الثانية، سيتم استخدام البيانات المتاحة فقط');
          authUsersError = secondMethodError;
        }
      }
      
      // استخدام البيانات المتاحة حتى لو فشلت بعض المحاولات
      console.log('إنشاء قائمة المستخدمين باستخدام البيانات المتاحة...');
      
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
      } else {
        console.warn('لم تتوفر بيانات المستخدمين الكاملة، سيتم استخدام البيانات المتاحة فقط.');
        if (authUsersError) {
          console.error('خطأ في جلب بيانات المستخدمين:', authUsersError);
          // لا نقوم بإظهار رسالة خطأ للمستخدم هنا لأننا سنستخدم البيانات المتاحة
        }
      }
      
      // تحويل بيانات الملفات الشخصية إلى قائمة المستخدمين
      const usersWithCompleteData = (profilesData || []).map((profile: any) => {
        // استخدام بيانات المستخدم من الخريطة إذا كانت متاحة، أو توليد بيانات افتراضية
        const userData = authUsersMap[profile.id] || { 
          email: profile.username ? `${profile.username}@example.com` : `user-${profile.id.substring(0, 8)}@example.com`, 
          created_at: profile.created_at || new Date().toISOString() 
        };
        
        // معالجة is_admin بشكل أكثر دقة
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
      
      // إذا كانت هناك مشكلة جزئية في جلب البيانات ولكن تمكنا من الحصول على بعض البيانات
      if (authUsersError && usersWithCompleteData.length > 0) {
        setFetchError('تمكنا من جلب البيانات الأساسية ولكن بعض المعلومات قد تكون غير مكتملة. قد ترى عناوين بريد إلكتروني افتراضية.');
        toast.warning('بعض بيانات المستخدمين قد تكون غير مكتملة، ولكن الوظائف الأساسية تعمل');
      }
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
      
      // التحقق من صحة البيانات
      if (!email || !email.includes('@') || !password || password.length < 6) {
        toast.error('بيانات المستخدم غير صالحة. تأكد من صحة البريد الإلكتروني وأن كلمة المرور 6 أحرف على الأقل');
        return false;
      }
      
      // إنشاء المستخدم
      let signUpResult;
      try {
        // محاولة استخدام وظيفة admin.createUser أولاً
        signUpResult = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        });
      } catch (adminError) {
        console.warn('فشل استخدام admin.createUser، جاري استخدام طريقة بديلة:', adminError);
        
        // محاولة استخدام signUp العادية كبديل
        signUpResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
      }
      
      const { data: signUpData, error: signUpError } = signUpResult;
      
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

  // وظيفة إعادة تعيين كلمة المرور - محسنة ومعاد كتابتها
  const resetUserPassword = async (userId: string, newPassword: string) => {
    setIsProcessing(true);
    try {
      console.log('بدء عملية إعادة تعيين كلمة المرور للمستخدم:', userId);
      
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

      // تنفيذ إعادة تعيين كلمة المرور باستخدام عدة طرق وآليات احتياطية
      let success = false;
      let lastError = null;
      
      // محاولة الطريقة الأولى: استخدام admin_reset_password_by_string_id
      try {
        console.log('محاولة 1: استخدام admin_reset_password_by_string_id...');
        const { data, error } = await supabase.rpc('admin_reset_password_by_string_id', {
          user_id_str: userId,
          new_password: newPassword
        });
        
        if (error) {
          lastError = error;
          console.warn('فشلت المحاولة 1:', error);
        } else if (data === true) {
          console.log('تم تغيير كلمة المرور بنجاح باستخدام admin_reset_password_by_string_id');
          success = true;
        }
      } catch (error1) {
        lastError = error1;
        console.warn('خطأ في تنفيذ المحاولة 1:', error1);
      }
      
      // محاولة الطريقة الثانية: استخدام admin_update_user_password
      if (!success) {
        try {
          console.log('محاولة 2: استخدام admin_update_user_password...');
          const { data, error } = await supabase.rpc('admin_update_user_password', {
            user_id: userId,
            new_password: newPassword
          });
          
          if (error) {
            lastError = error;
            console.warn('فشلت المحاولة 2:', error);
          } else if (data === true) {
            console.log('تم تغيير كلمة المرور بنجاح باستخدام admin_update_user_password');
            success = true;
          }
        } catch (error2) {
          lastError = error2;
          console.warn('خطأ في تنفيذ المحاولة 2:', error2);
        }
      }
      
      // محاولة الطريقة الثالثة: استخدام admin_reset_password_direct_api
      if (!success) {
        try {
          console.log('محاولة 3: استخدام admin_reset_password_direct_api...');
          const { data, error } = await supabase.rpc('admin_reset_password_direct_api', {
            user_id_str: userId,
            new_password: newPassword
          });
          
          if (error) {
            lastError = error;
            console.warn('فشلت المحاولة 3:', error);
          } else if (data === true) {
            console.log('تم تغيير كلمة المرور بنجاح باستخدام admin_reset_password_direct_api');
            success = true;
          }
        } catch (error3) {
          lastError = error3;
          console.warn('خطأ في تنفيذ المحاولة 3:', error3);
        }
      }
      
      // محاولة الطريقة الرابعة: استخدام admin_update_user_password_by_email
      if (!success) {
        try {
          // الحصول على البريد الإلكتروني للمستخدم أولاً
          const user = users.find(u => u.id === userId);
          if (user && user.email) {
            console.log('محاولة 4: استخدام admin_update_user_password_by_email مع البريد:', user.email);
            const { data, error } = await supabase.rpc('admin_update_user_password_by_email', {
              user_email: user.email,
              new_password: newPassword
            });
            
            if (error) {
              lastError = error;
              console.warn('فشلت المحاولة 4:', error);
            } else if (data === true) {
              console.log('تم تغيير كلمة المرور بنجاح باستخدام admin_update_user_password_by_email');
              success = true;
            }
          } else {
            console.warn('لم يتم العثور على بريد إلكتروني للمستخدم، تخطي المحاولة 4');
          }
        } catch (error4) {
          lastError = error4;
          console.warn('خطأ في تنفيذ المحاولة 4:', error4);
        }
      }
      
      // إذا نجحت أي من المحاولات
      if (success) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        resetPasswordStates();
        return;
      } else {
        const errorMessage = lastError ? (lastError.message || 'خطأ غير معروف') : 'فشلت جميع محاولات إعادة تعيين كلمة المرور';
        console.error('فشل إعادة تعيين كلمة المرور:', errorMessage);
        toast.error(`فشل إعادة تعيين كلمة المرور: ${errorMessage}`);
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
          
            خطأ في جلب البيانات
          
          
            {fetchError}
            
              
                إعادة المحاولة
              
            
          
        
      
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
