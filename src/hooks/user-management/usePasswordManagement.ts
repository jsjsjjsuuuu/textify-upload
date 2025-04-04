
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

  // وظيفة استدعاء RPC مباشرة
  const resetPasswordViaRPC = async (userId: string, password: string): Promise<boolean> => {
    console.log('[usePasswordManagement] محاولة استخدام RPC لإعادة تعيين كلمة المرور للمستخدم:', userId);
    try {
      const { data, error } = await supabase.rpc(
        'admin_reset_user_password',
        { user_id_str: userId, new_password: password }
      );
      
      if (error) {
        console.error('[usePasswordManagement] خطأ RPC:', error.message);
        return false;
      }
      
      console.log('[usePasswordManagement] نتيجة RPC:', data);
      return data === true;
    } catch (error) {
      console.error('[usePasswordManagement] استثناء RPC:', error);
      return false;
    }
  };

  // وظيفة إعادة تعيين كلمة المرور المحسنة
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
      
      // محاولة استخدام وظيفة RPC أولاً - طريقة 1
      const rpcResult = await resetPasswordViaRPC(userId, password);
      if (rpcResult) {
        console.log('[usePasswordManagement] تم إعادة تعيين كلمة المرور بنجاح عبر RPC');
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        resetPasswordStates();
        setLastResetResult(true);
        return true;
      }
      
      console.log('[usePasswordManagement] فشلت محاولة RPC، سيتم المتابعة باستخدام Edge Function');
      
      // استدعاء Edge Function مع هيدرز مناسبة - طريقة 2
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          userId: userId,
          newPassword: password
        }
      });
      
      console.log('[usePasswordManagement] استجابة إعادة تعيين كلمة المرور:', { 
        success: data?.success === true, 
        error: error ? error.message : (data?.error || null)
      });
      
      if (error || !data || data.success !== true) {
        const errorMessage = error?.message || data?.error || 'فشلت عملية إعادة تعيين كلمة المرور';
        console.error('[usePasswordManagement] خطأ في إعادة تعيين كلمة المرور:', errorMessage);
        toast.error(`فشلت عملية إعادة تعيين كلمة المرور: ${errorMessage}`);
        setLastResetResult(false);
        return false;
      }
      
      toast.success('تم إعادة تعيين كلمة المرور بنجاح');
      resetPasswordStates();
      setLastResetResult(true);
      return true;
    } catch (error: any) {
      console.error('[usePasswordManagement] خطأ في إعادة تعيين كلمة المرور:', error);
      toast.error(`حدث خطأ أثناء إعادة تعيين كلمة المرور: ${error.message || 'خطأ غير معروف'}`);
      setLastResetResult(false);
      return false;
    } finally {
      setIsProcessing(false);
      setShowConfirmReset(false);
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
