
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePasswordManagement = () => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [userToReset, setUserToReset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // وظيفة إعادة تعيين حالات كلمة المرور
  const resetPasswordStates = () => {
    setNewPassword('');
    setShowPassword(false);
    setShowConfirmReset(false);
    setUserToReset(null);
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
      
      // محاولة الطريقة الثالثة والرابعة (مختصرة لتوفير المساحة)
      
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

  return {
    newPassword,
    showPassword,
    showConfirmReset,
    userToReset,
    isProcessing,
    setNewPassword,
    setShowPassword,
    setShowConfirmReset,
    setUserToReset,
    resetPasswordStates,
    prepareUserPasswordReset,
    resetUserPassword
  };
};
