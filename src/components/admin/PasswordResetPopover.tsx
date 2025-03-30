
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Lock, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/UserProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [userData, setUserData] = useState<UserProfile | null>(null);

  // جلب بيانات المستخدم عند فتح النافذة المنبثقة
  useEffect(() => {
    if (isOpen && user?.id) {
      console.log('فتح نافذة تغيير كلمة المرور للمستخدم:', {
        userId: user.id,
        userEmail: user.email || 'بريد إلكتروني غير متوفر',
        userName: user.full_name || 'اسم غير متوفر'
      });
      
      // التأكد من أن جميع البيانات المطلوبة موجودة
      if (!user.email) {
        console.warn('بيانات المستخدم غير مكتملة - البريد الإلكتروني مفقود:', user);
      }
      
      if (!user.id) {
        console.error('بيانات المستخدم غير مكتملة - معرف المستخدم مفقود!', user);
        toast.error('بيانات المستخدم غير مكتملة');
        setIsOpen(false);
        return;
      }
      
      // نسخ بيانات المستخدم للاستخدام المحلي مع التأكد من وجود القيم الأساسية
      setUserData({
        ...user,
        id: user.id,
        email: user.email || `user-${user.id.substring(0, 8)}@example.com` // قيمة احتياطية
      });
    } else {
      // إعادة تعيين البيانات عند إغلاق النافذة
      if (!isOpen) {
        setUserData(null);
      }
    }
  }, [isOpen, user]);

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

  // إعادة تعيين كلمة المرور - نسخة مبسطة وأكثر موثوقية
  const resetPassword = async () => {
    if (!validatePassword()) {
      return;
    }

    if (!userData || !userData.id) {
      toast.error("بيانات المستخدم غير مكتملة");
      console.error("بيانات المستخدم غير مكتملة:", userData);
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const userId = userData.id;
      console.log(`بدء عملية تغيير كلمة المرور للمستخدم:`, {
        userId,
        userEmail: userData.email,
        passwordLength: newPassword.length
      });
      
      // محاولة تغيير كلمة المرور
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('admin_reset_password_by_string_id', {
        user_id_str: userId,
        new_password: newPassword
      });
      const timeTaken = Date.now() - startTime;
      
      console.log('نتيجة تغيير كلمة المرور:', { 
        success: data === true, 
        error: error ? error.message : null,
        timeTaken: `${timeTaken}ms`
      });
      
      if (error) {
        // محاولة استخدام وظيفة بديلة في حالة الفشل
        console.warn('محاولة استخدام وظيفة بديلة لتغيير كلمة المرور');
        
        const { data: altData, error: altError } = await supabase.rpc('admin_reset_password_direct_api', {
          user_id_str: userId,
          new_password: newPassword
        });
        
        if (altError) {
          throw altError;
        }
        
        if (altData === true) {
          console.log('نجحت عملية تغيير كلمة المرور باستخدام الوظيفة البديلة');
          toast.success("تم تغيير كلمة المرور بنجاح");
          closePopover();
          return;
        } else {
          throw new Error('فشلت عملية تغيير كلمة المرور باستخدام الوظيفة البديلة');
        }
      }
      
      // تأكيد نجاح العملية
      if (data === true) {
        toast.success("تم تغيير كلمة المرور بنجاح");
        closePopover();
      } else {
        toast.error("فشل في تغيير كلمة المرور لسبب غير معروف");
        console.error('فشل تغيير كلمة المرور، البيانات المستلمة:', data);
      }
    } catch (error: any) {
      console.error(`خطأ في تغيير كلمة المرور:`, error);
      toast.error(`حدث خطأ: ${error.message || "خطأ غير معروف"}`);
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

  // التحقق من صحة بيانات المستخدم قبل السماح بفتح النافذة
  const handleBeforeOpen = (open: boolean): boolean => {
    if (open) {
      console.log('طلب فتح نافذة تغيير كلمة المرور للمستخدم:', user?.id);
      
      if (!user || !user.id) {
        console.error('بيانات المستخدم غير صالحة أو غير مكتملة:', user);
        toast.error('بيانات المستخدم غير مكتملة');
        return false; // منع فتح النافذة مع بيانات غير صالحة
      }
    }
    return true; // السماح بالعملية
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      if (handleBeforeOpen(open)) {
        setIsOpen(open);
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          onClick={() => {
            console.log('تم النقر على زر تغيير كلمة المرور للمستخدم:', {
              userId: user?.id,
              userEmail: user?.email
            });
          }}
        >
          <Lock className="h-4 w-4 mr-1" />
          تغيير كلمة المرور
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80">
        {userData ? (
          <div className="space-y-4">
            <h4 className="font-medium">تغيير كلمة المرور لـ {userData.full_name || userData.email}</h4>
            
            {passwordError && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs mr-2">
                  {passwordError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <FormLabel htmlFor={`new-password-${userData.id}`}>كلمة المرور الجديدة</FormLabel>
              <div className="relative">
                <Input
                  id={`new-password-${userData.id}`}
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
              
              <FormLabel htmlFor={`confirm-password-${userData.id}`}>تأكيد كلمة المرور</FormLabel>
              <div className="relative">
                <Input
                  id={`confirm-password-${userData.id}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="تأكيد كلمة المرور"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="pr-10"
                />
              </div>
              
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
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">جاري تحميل بيانات المستخدم...</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default PasswordResetPopover;
