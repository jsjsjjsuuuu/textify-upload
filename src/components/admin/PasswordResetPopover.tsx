
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/UserProfile";

interface PasswordResetPopoverProps {
  user: UserProfile;
}

const PasswordResetPopover: React.FC<PasswordResetPopoverProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  // إعادة تعيين كلمة المرور باستخدام آلية ذات محاولات متعددة
  const resetPassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setIsChangingPassword(true);
    
    try {
      console.log(`[PasswordReset] بدء عملية تغيير كلمة المرور للمستخدم:`, {
        userId: user.id,
        userEmail: user.email,
        passwordLength: newPassword.length
      });
      
      let success = false;
      let lastError = null;
      
      // المحاولة الأولى: استخدام admin_reset_password_by_string_id
      try {
        console.log(`[PasswordReset] محاولة 1: استخدام وظيفة admin_reset_password_by_string_id`);
        
        const { data: firstAttemptData, error: firstAttemptError } = await supabase.rpc('admin_reset_password_by_string_id', {
          user_id_str: user.id,
          new_password: newPassword
        });
        
        console.log(`[PasswordReset] نتيجة المحاولة 1:`, { data: firstAttemptData, errorMessage: firstAttemptError?.message });
        
        if (firstAttemptError) {
          lastError = firstAttemptError;
          console.warn(`[PasswordReset] فشلت المحاولة 1:`, firstAttemptError);
        } else if (firstAttemptData === true) {
          console.log(`[PasswordReset] نجحت المحاولة 1`);
          success = true;
        }
      } catch (error1) {
        lastError = error1;
        console.warn(`[PasswordReset] استثناء في المحاولة 1:`, error1);
      }
      
      // المحاولة الثانية: استخدام admin_update_user_password
      if (!success) {
        try {
          console.log(`[PasswordReset] محاولة 2: استخدام وظيفة admin_update_user_password`);
          
          const { data: secondAttemptData, error: secondAttemptError } = await supabase.rpc('admin_update_user_password', {
            user_id: user.id,
            new_password: newPassword
          });
          
          console.log(`[PasswordReset] نتيجة المحاولة 2:`, { data: secondAttemptData, errorMessage: secondAttemptError?.message });
          
          if (secondAttemptError) {
            lastError = secondAttemptError;
            console.warn(`[PasswordReset] فشلت المحاولة 2:`, secondAttemptError);
          } else if (secondAttemptData === true) {
            console.log(`[PasswordReset] نجحت المحاولة 2`);
            success = true;
          }
        } catch (error2) {
          lastError = error2;
          console.warn(`[PasswordReset] استثناء في المحاولة 2:`, error2);
        }
      }
      
      // المحاولة الثالثة: استخدام admin_reset_password_direct_api
      if (!success) {
        try {
          console.log(`[PasswordReset] محاولة 3: استخدام وظيفة admin_reset_password_direct_api`);
          
          const { data: thirdAttemptData, error: thirdAttemptError } = await supabase.rpc('admin_reset_password_direct_api', {
            user_id_str: user.id,
            new_password: newPassword
          });
          
          console.log(`[PasswordReset] نتيجة المحاولة 3:`, { data: thirdAttemptData, errorMessage: thirdAttemptError?.message });
          
          if (thirdAttemptError) {
            lastError = thirdAttemptError;
            console.warn(`[PasswordReset] فشلت المحاولة 3:`, thirdAttemptError);
          } else if (thirdAttemptData === true) {
            console.log(`[PasswordReset] نجحت المحاولة 3`);
            success = true;
          }
        } catch (error3) {
          lastError = error3;
          console.warn(`[PasswordReset] استثناء في المحاولة 3:`, error3);
        }
      }
      
      // التعامل مع نتيجة كل المحاولات
      if (success) {
        toast.success("تم تغيير كلمة المرور بنجاح");
        closePopover();
      } else {
        const errorMessage = lastError ? 
          (lastError.message || 'خطأ غير معروف') : 
          'فشلت جميع محاولات تغيير كلمة المرور';
        console.error(`[PasswordReset] فشل تغيير كلمة المرور بعد كل المحاولات:`, errorMessage);
        toast.error(`فشل في تغيير كلمة المرور: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error(`[PasswordReset] خطأ غير متوقع:`, error);
      toast.error(`حدث خطأ أثناء تغيير كلمة المرور: ${error.message || "خطأ غير معروف"}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closePopover = () => {
    setIsOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (passwordError && e.target.value.length >= 6) {
      if (confirmPassword === e.target.value) {
        setPasswordError(null);
      } else if (confirmPassword) {
        setPasswordError('كلمة المرور وتأكيدها غير متطابقين');
      }
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (passwordError && e.target.value === newPassword) {
      setPasswordError(null);
    } else if (newPassword && e.target.value && e.target.value !== newPassword) {
      setPasswordError('كلمة المرور وتأكيدها غير متطابقين');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          <Lock className="h-4 w-4 mr-1" />
          تغيير كلمة المرور
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">تغيير كلمة المرور لـ {user.full_name || user.email}</h4>
          <div className="space-y-2">
            <FormLabel htmlFor={`new-password-${user.id}`}>كلمة المرور الجديدة</FormLabel>
            <div className="relative">
              <Input
                id={`new-password-${user.id}`}
                type={showPassword ? "text" : "password"}
                placeholder="كلمة المرور الجديدة"
                value={newPassword}
                onChange={handlePasswordChange}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute left-3 top-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <FormLabel htmlFor={`confirm-password-${user.id}`}>تأكيد كلمة المرور</FormLabel>
            <div className="relative">
              <Input
                id={`confirm-password-${user.id}`}
                type={showPassword ? "text" : "password"}
                placeholder="تأكيد كلمة المرور"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="pr-10"
              />
            </div>
            
            {passwordError && (
              <p className="text-xs text-red-500">{passwordError}</p>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant="outline"
                onClick={closePopover}
                disabled={isChangingPassword}
              >
                إلغاء
              </Button>
              <Button
                onClick={resetPassword}
                disabled={!newPassword || newPassword !== confirmPassword || isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري التغيير...
                  </>
                ) : "تغيير"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              كلمة المرور يجب أن تكون 6 أحرف على الأقل.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PasswordResetPopover;
