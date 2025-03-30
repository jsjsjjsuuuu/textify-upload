
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/UserProfile";

interface PasswordResetPopoverProps {
  user: UserProfile;
}

const PasswordResetPopover: React.FC<PasswordResetPopoverProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsChangingPassword(true);
    
    try {
      console.log("محاولة تغيير كلمة المرور للمستخدم:", user.id);
      
      // محاولة أولى باستخدام admin_reset_password_by_string_id
      const { data, error } = await supabase.rpc('admin_reset_password_by_string_id', {
        user_id_str: user.id,
        new_password: newPassword
      });
      
      console.log("نتيجة محاولة تغيير كلمة المرور الأولى:", { data, error });

      if (error) {
        console.error("خطأ في تغيير كلمة المرور:", error);
        
        // محاولة ثانية باستخدام admin_update_user_password
        console.log("جاري تجربة الطريقة البديلة لتغيير كلمة المرور...");
        
        const { data: secondAttemptData, error: secondAttemptError } = await supabase.rpc('admin_update_user_password', {
          user_id: user.id,
          new_password: newPassword
        });
        
        console.log("نتيجة المحاولة الثانية:", { secondAttemptData, secondAttemptError });
        
        if (secondAttemptError) {
          toast.error(`فشل في تغيير كلمة المرور: ${secondAttemptError.message}`);
          return;
        }
        
        if (secondAttemptData === true) {
          toast.success("تم تغيير كلمة المرور بنجاح");
          closePopover();
          return;
        } else {
          toast.error("فشل في تغيير كلمة المرور");
          return;
        }
      }

      if (data === true) {
        toast.success("تم تغيير كلمة المرور بنجاح");
        closePopover();
      } else {
        toast.error("فشل في تغيير كلمة المرور");
      }
    } catch (error: any) {
      console.error("خطأ غير متوقع:", error);
      toast.error(`حدث خطأ أثناء تغيير كلمة المرور: ${error.message || "خطأ غير معروف"}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closePopover = () => {
    setIsOpen(false);
    setNewPassword("");
    setShowPassword(false);
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
                onChange={(e) => setNewPassword(e.target.value)}
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
                disabled={newPassword.length < 6 || isChangingPassword}
              >
                {isChangingPassword ? "جاري التغيير..." : "تغيير"}
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
