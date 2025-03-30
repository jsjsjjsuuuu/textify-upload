
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePasswordManagement = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [userToReset, setUserToReset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [lastResetResult, setLastResetResult] = useState<boolean | null>(null);

  // وظيفة إعادة تعيين حالات كلمة المرور
  const resetPasswordStates = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmReset(false);
    setUserToReset(null);
    setPasswordError(null);
  };

  // التحقق من صحة كلمة المرور
  const validatePassword = (): boolean => {
    if (!newPassword || newPassword.trim() === '') {
      setPasswordError('كلمة المرور لا يمكن أن تكون فارغة');
      return false;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور وتأكيدها غير متطابقين');
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  // إعداد المستخدم لإعادة تعيين كلمة المرور
  const prepareUserPasswordReset = (userId: string) => {
    if (!userId) {
      console.error('[usePasswordManagement] معرف المستخدم غير صالح:', userId);
      toast.error('معرف المستخدم غير صالح');
      return;
    }
    
    console.log('[usePasswordManagement] إعداد إعادة تعيين كلمة المرور للمستخدم:', userId);
    resetPasswordStates(); // إعادة تعيين الحالات قبل فتح مربع الحوار
    setUserToReset(userId);
    setShowConfirmReset(true);
    setLastResetResult(null);
  };

  // وظيفة إعادة تعيين كلمة المرور - تستخدم الوظيفة الجديدة admin_reset_user_password
  const resetUserPassword = async (userId: string, password: string): Promise<boolean> => {
    if (!userId) {
      console.error('[usePasswordManagement] معرف المستخدم غير صالح:', userId);
      toast.error('معرف المستخدم غير صالح');
      return false;
    }

    if (!password || password.length < 6) {
      console.error('[usePasswordManagement] كلمة المرور غير صالحة:', { 
        passwordEmpty: !password, 
        passwordLength: password ? password.length : 0 
      });
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }

    setIsProcessing(true);
    try {
      console.log('[usePasswordManagement] بدء عملية إعادة تعيين كلمة المرور للمستخدم:', userId);
      
      // استخدام وظيفة admin_reset_user_password الجديدة
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('admin_reset_user_password', {
        user_id_str: userId,
        new_password: password
      });
      const timeTaken = Date.now() - startTime;
      
      console.log('[usePasswordManagement] نتيجة إعادة تعيين كلمة المرور:', { 
        success: data === true, 
        error: error ? error.message : null,
        timeTaken: `${timeTaken}ms`
      });
      
      if (error) {
        console.error('[usePasswordManagement] خطأ في إعادة تعيين كلمة المرور:', error);
        toast.error(`فشلت عملية إعادة تعيين كلمة المرور: ${error.message}`);
        setLastResetResult(false);
        return false;
      }
      
      if (data === true) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        resetPasswordStates();
        setLastResetResult(true);
        return true;
      } else {
        console.error('[usePasswordManagement] فشلت عملية إعادة تعيين كلمة المرور، البيانات المستلمة:', data);
        toast.error('فشلت عملية إعادة تعيين كلمة المرور');
        setLastResetResult(false);
        return false;
      }
    } catch (error: any) {
      console.error('[usePasswordManagement] خطأ في إعادة تعيين كلمة المرور:', error);
      toast.error(`حدث خطأ أثناء إعادة تعيين كلمة المرور: ${error.message || 'خطأ غير معروف'}`);
      setLastResetResult(false);
      return false;
    } finally {
      setIsProcessing(false);
      setShowConfirmReset(false);
      // لا نقوم بإعادة تعيين userToReset هنا حتى نتمكن من محاولة إعادة تعيين كلمة المرور مرة أخرى إذا فشلت العملية
    }
  };

  return {
    newPassword,
    confirmPassword,
    showPassword,
    showConfirmReset,
    userToReset,
    isProcessing,
    passwordError,
    lastResetResult,
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
  };
};
