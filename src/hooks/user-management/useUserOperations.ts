
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';

export const useUserOperations = (users: UserProfile[], setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>, fetchUsers: () => Promise<void>) => {
  const [isProcessing, setIsProcessing] = useState(false);

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
      
      // استدعاء وظيفة Edge Function لإنشاء المستخدم
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          fullName,
          isAdmin,
          isApproved,
          subscriptionPlan,
          accountStatus
        }
      });
      
      if (error) {
        console.error('خطأ في استدعاء وظيفة إنشاء المستخدم:', error);
        toast.error(`فشل في إنشاء المستخدم: ${error.message}`);
        return false;
      }
      
      if (!data.success) {
        console.error('فشل في إنشاء المستخدم:', data.error);
        toast.error(`فشل في إنشاء المستخدم: ${data.error}`);
        return false;
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

  return {
    isProcessing,
    addNewUser,
    approveUser,
    rejectUser
  };
};
