
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { KeyRound, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  confirmPassword: z.string().min(6, { message: 'تأكيد كلمة المرور مطلوب' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidResetLink, setIsValidResetLink] = useState(true);
  
  // إضافة استخدام useForm هنا
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // التحقق مما إذا كان المستخدم قد وصل من خلال رابط إعادة تعيين كلمة المرور
    const checkResetSession = async () => {
      console.log("التحقق من صلاحية جلسة إعادة تعيين كلمة المرور");
      const { data, error } = await supabase.auth.getSession();
      
      console.log("نتيجة فحص الجلسة:", data.session ? "صالحة" : "غير صالحة", error ? `خطأ: ${error.message}` : "");
      
      if (error || !data.session) {
        console.error("رابط إعادة تعيين كلمة المرور غير صالح:", error?.message || "لا توجد جلسة");
        setIsValidResetLink(false);
      } else {
        console.log("رابط إعادة تعيين كلمة المرور صالح، نوع الجلسة:", data.session.access_token ? "جلسة مصادقة" : "جلسة إعادة تعيين كلمة المرور");
      }
    };

    checkResetSession();
  }, []);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("محاولة إعادة تعيين كلمة المرور");
      const { error, success } = await resetPassword(data.password);
      
      if (error) {
        console.error("فشل إعادة تعيين كلمة المرور:", error.message);
        setError(error.message);
      } else if (success) {
        console.log("تم إعادة تعيين كلمة المرور بنجاح");
        setResetSuccess(true);
        
        // بعد 3 ثواني، التوجيه إلى صفحة تسجيل الدخول
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error("خطأ غير متوقع أثناء إعادة تعيين كلمة المرور:", error);
      setError(error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidResetLink) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container max-w-md mx-auto p-4 pt-10">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl text-center">رابط غير صالح</CardTitle>
              <CardDescription className="text-center">
                الرابط الذي استخدمته غير صالح أو منتهي الصلاحية. يرجى طلب رابط استعادة جديد.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link to="/forgot-password">طلب رابط جديد</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-md mx-auto p-4 pt-10">
        <Card className="w-full">
          <CardHeader>
            {resetSuccess ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">تم تغيير كلمة المرور بنجاح</CardTitle>
                <CardDescription className="text-center">
                  تم تغيير كلمة المرور الخاصة بك بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول خلال لحظات...
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl text-center">إعادة تعيين كلمة المرور</CardTitle>
                <CardDescription className="text-center">
                  أدخل كلمة المرور الجديدة التي ترغب في استخدامها
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            
            {!resetSuccess && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="أدخل كلمة المرور الجديدة" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="أكد كلمة المرور الجديدة" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري إعادة تعيين كلمة المرور...
                      </>
                    ) : 'إعادة تعيين كلمة المرور'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          
          {!resetSuccess && (
            <CardFooter className="flex justify-center">
              <Button variant="ghost" asChild className="mt-2">
                <Link to="/login" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  العودة إلى تسجيل الدخول
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
