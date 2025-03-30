
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
    if (!validatePassword()) {
      return;
    }
    
    console.log('[usePasswordManagement] إعداد إعادة تعيين كلمة المرور للمستخدم:', userId);
    setUserToReset(userId);
    setShowConfirmReset(true);
  };

  // وظيفة إعادة تعيين كلمة المرور - محسنة ومعاد كتابتها
  const resetUserPassword = async (userId: string, password: string) => {
    setIsProcessing(true);
    try {
      console.log('[usePasswordManagement] بدء عملية إعادة تعيين كلمة المرور للمستخدم:', {
        userId,
        passwordLength: password.length
      });
      
      if (!password || password.trim() === '') {
        console.error('[usePasswordManagement] كلمة المرور فارغة');
        toast.error('كلمة المرور لا يمكن أن تكون فارغة');
        setIsProcessing(false);
        return false;
      }
      
      if (!userId) {
        console.error('[usePasswordManagement] معرف المستخدم غير موجود');
        toast.error('معرف المستخدم غير صالح');
        setIsProcessing(false);
        return false;
      }

      // تنفيذ إعادة تعيين كلمة المرور باستخدام عدة طرق وآليات احتياطية
      let success = false;
      let lastError = null;
      
      // محاولة الطريقة الأولى: استخدام admin_reset_password_by_string_id
      try {
        console.log('[usePasswordManagement] محاولة 1: استخدام admin_reset_password_by_string_id...');
        const { data: firstAttemptData, error: firstAttemptError } = await supabase.rpc('admin_reset_password_by_string_id', {
          user_id_str: userId,
          new_password: password
        });
        
        console.log('[usePasswordManagement] نتيجة المحاولة 1:', { data: firstAttemptData, errorMessage: firstAttemptError?.message });
        
        if (firstAttemptError) {
          lastError = firstAttemptError;
          console.warn('[usePasswordManagement] فشلت المحاولة 1:', firstAttemptError);
        } else if (firstAttemptData === true) {
          console.log('[usePasswordManagement] نجحت المحاولة 1');
          success = true;
        }
      } catch (error1) {
        lastError = error1;
        console.warn('[usePasswordManagement] استثناء في المحاولة 1:', error1);
      }
      
      // محاولة الطريقة الثانية: استخدام admin_update_user_password
      if (!success) {
        try {
          console.log('[usePasswordManagement] محاولة 2: استخدام admin_update_user_password...');
          const { data: secondAttemptData, error: secondAttemptError } = await supabase.rpc('admin_update_user_password', {
            user_id: userId,
            new_password: password
          });
          
          console.log('[usePasswordManagement] نتيجة المحاولة 2:', { data: secondAttemptData, errorMessage: secondAttemptError?.message });
          
          if (secondAttemptError) {
            lastError = secondAttemptError;
            console.warn('[usePasswordManagement] فشلت المحاولة 2:', secondAttemptError);
          } else if (secondAttemptData === true) {
            console.log('[usePasswordManagement] نجحت المحاولة 2');
            success = true;
          }
        } catch (error2) {
          lastError = error2;
          console.warn('[usePasswordManagement] استثناء في المحاولة 2:', error2);
        }
      }
      
      // محاولة الطريقة الثالثة: استخدام admin_reset_password_direct_api
      if (!success) {
        try {
          console.log('[usePasswordManagement] محاولة 3: استخدام admin_reset_password_direct_api...');
          const { data: thirdAttemptData, error: thirdAttemptError } = await supabase.rpc('admin_reset_password_direct_api', {
            user_id_str: userId,
            new_password: password
          });
          
          console.log('[usePasswordManagement] نتيجة المحاولة 3:', { data: thirdAttemptData, errorMessage: thirdAttemptError?.message });
          
          if (thirdAttemptError) {
            lastError = thirdAttemptError;
            console.warn('[usePasswordManagement] فشلت المحاولة 3:', thirdAttemptError);
          } else if (thirdAttemptData === true) {
            console.log('[usePasswordManagement] نجحت المحاولة 3');
            success = true;
          }
        } catch (error3) {
          lastError = error3;
          console.warn('[usePasswordManagement] استثناء في المحاولة 3:', error3);
        }
      }
      
      // التعامل مع نتيجة المحاولات
      if (success) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        resetPasswordStates();
        return true;
      } else {
        const errorMessage = lastError ? 
          (lastError.message || 'خطأ غير معروف') : 
          'فشلت جميع محاولات إعادة تعيين كلمة المرور';
        console.error('[usePasswordManagement] فشل إعادة تعيين كلمة المرور:', errorMessage);
        toast.error(`فشل إعادة تعيين كلمة المرور: ${errorMessage}`);
        return false;
      }
    } catch (error: any) {
      console.error('[usePasswordManagement] خطأ في إعادة تعيين كلمة المرور:', error);
      toast.error(`حدث خطأ أثناء إعادة تعيين كلمة المرور: ${error.message || 'خطأ غير معروف'}`);
      return false;
    } finally {
      setIsProcessing(false);
      setShowConfirmReset(false);
      setUserToReset(null);
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
