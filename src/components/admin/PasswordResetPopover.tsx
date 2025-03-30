import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import { UserProfile } from '@/types/UserProfile';
import { supabase } from '@/integrations/supabase/client';

interface PasswordResetPopoverProps {
  user: UserProfile;
}

const PasswordResetPopover: React.FC<PasswordResetPopoverProps> = ({ user }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (!user || !user.id) {
      toast({
        title: "خطأ",
        description: "معرف المستخدم غير صالح أو غير موجود",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('محاولة إعادة تعيين كلمة المرور للمستخدم بواسطة معرف:', user.id);
      console.log('طول كلمة المرور المستخدمة:', newPassword.length);
      
      // الحصول على رمز المصادقة للمستخدم الحالي
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('جلسة المستخدم غير صالحة');
      }

      // استدعاء Edge Function بدلاً من RPC
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          userId: user.id,
          newPassword: newPassword
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      // تسجيل نتيجة عملية إعادة تعيين كلمة المرور للتصحيح
      console.log('نتيجة إعادة تعيين كلمة المرور:', { 
        success: data?.success === true, 
        error: error ? error.message : (data?.error || null),
        userId: user.id
      });
      
      if (error || !data || data.success !== true) {
        const errorMessage = error?.message || data?.error || 'فشلت عملية إعادة تعيين كلمة المرور';
        throw new Error(errorMessage);
      }
      
      setIsSuccess(true);
      toast({
        title: "تم بنجاح",
        description: "تم إعادة تعيين كلمة المرور بنجاح",
        duration: 3000,
      });
      
      setTimeout(() => {
        setIsOpen(false);
        setNewPassword('');
        setIsSuccess(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error);
      
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-1">
          <KeyRound className="h-4 w-4" />
          إعادة تعيين كلمة المرور
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            <h4 className="font-medium">تعيين كلمة مرور جديدة</h4>
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">
            سيتم تعيين كلمة المرور للمستخدم <span className="font-medium">{user.email || user.username}</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                disabled={isLoading || isSuccess}
              />
              <button
                type="button"
                className="absolute left-3 top-2.5 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              onClick={handleResetPassword}
              className="w-full"
              disabled={isLoading || isSuccess || !newPassword}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري التنفيذ...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تم بنجاح!
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 ml-2" />
                  تعيين كلمة المرور
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PasswordResetPopover;
