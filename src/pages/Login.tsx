
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Mail, UserPlus, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صحيح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, userProfile, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoginError, setHasLoginError] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  
  console.log("تهيئة صفحة تسجيل الدخول، حالة الجلسة:", !!session, "حالة المستخدم:", !!user);
  console.log("بيانات الجلسة:", session);
  console.log("هل تم العثور على ملف المستخدم؟", !!userProfile);

  // التحقق من وجود مستخدم
  useEffect(() => {
    console.log("فحص حالة المستخدم:", user ? "موجود" : "غير موجود", 
                "الملف الشخصي:", userProfile ? "موجود" : "غير موجود",
                "الموافقة:", userProfile?.isApproved);
                
    if (user) {
      // إذا كان المستخدم موجود لكن لا يوجد ملف شخصي، قم بإنشاء ملف شخصي
      if (!userProfile) {
        console.log("المستخدم موجود لكن لا يوجد ملف شخصي، محاولة إنشاء ملف شخصي جديد");
        createUserProfile(user.id);
      } else if (userProfile?.isApproved) {
        console.log("المستخدم مسجل الدخول ومعتمد، جارِ التوجيه إلى الصفحة الرئيسية");
        navigate('/');
      } else {
        console.log("المستخدم مسجل الدخول لكن غير معتمد، البقاء في صفحة تسجيل الدخول");
        setHasLoginError(true);
        setLoginErrorMessage('حسابك قيد المراجعة. يرجى الانتظار حتى تتم الموافقة عليه من قبل المسؤول.');
      }
    }
  }, [user, userProfile, navigate]);

  // وظيفة لإنشاء ملف شخصي للمستخدم إذا لم يكن موجودًا
  const createUserProfile = async (userId: string) => {
    try {
      console.log("محاولة إنشاء ملف شخصي جديد للمستخدم:", userId);
      
      // التحقق مما إذا كان الملف الشخصي موجود بالفعل
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // حدث خطأ غير أن الملف الشخصي غير موجود
        console.error("خطأ في التحقق من وجود الملف الشخصي:", fetchError);
        return;
      }
      
      if (existingProfile) {
        console.log("تم العثور على ملف شخصي موجود:", existingProfile);
        return;
      }
      
      // إنشاء ملف شخصي جديد
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("تعذر الحصول على بيانات المستخدم:", userError);
        return;
      }
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId,
            username: userData.user?.email?.split('@')[0],
            is_approved: true // تعيين حالة الاعتماد كـ true افتراضيًا للمستخدمين الجدد
          }
        ]);
      
      if (insertError) {
        console.error("فشل في إنشاء ملف شخصي:", insertError);
      } else {
        console.log("تم إنشاء ملف شخصي جديد بنجاح للمستخدم:", userId);
        // إعادة تحميل الصفحة للحصول على الملف الشخصي المحدث
        window.location.reload();
      }
    } catch (error) {
      console.error("خطأ غير متوقع في إنشاء الملف الشخصي:", error);
    }
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log("محاولة تسجيل الدخول باستخدام:", data.email);
    
    setIsLoading(true);
    setHasLoginError(false);
    
    try {
      // إرسال بيانات تسجيل الدخول مباشرة إلى Supabase
      console.log("إرسال بيانات تسجيل الدخول إلى Supabase:", { email: data.email, password: "***مخفي***" });
      
      const { error, user: authUser } = await signIn(data.email, data.password);
      
      console.log("نتيجة تسجيل الدخول:", error ? `فشل: ${error.message}` : "نجاح", "المستخدم:", authUser || "لا يوجد");
      
      if (error) {
        setHasLoginError(true);
        
        // ترجمة رسائل الخطأ للعربية
        if (error.message && error.message.includes('Invalid login credentials')) {
          setLoginErrorMessage('بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
        } else if (error.message && error.message.includes('Email not confirmed')) {
          setLoginErrorMessage('البريد الإلكتروني غير مؤكد. يرجى تفقد بريدك الإلكتروني والنقر على رابط التأكيد.');
        } else if (error.message && error.message.includes('الحساب قيد المراجعة')) {
          setLoginErrorMessage('لم تتم الموافقة على حسابك بعد. يرجى الانتظار حتى يتم مراجعته من قبل المسؤول.');
        } else {
          setLoginErrorMessage(error.message || 'حدث خطأ أثناء تسجيل الدخول.');
        }
      } else if (!authUser) {
        setHasLoginError(true);
        setLoginErrorMessage('حدث خطأ غير متوقع. لم يتم العثور على بيانات المستخدم.');
      } else {
        // نجاح تسجيل الدخول، سيتم التوجيه في الـ useEffect
        console.log("تم تسجيل الدخول بنجاح، جاري التحقق من حالة الاعتماد");
      }
    } catch (error: any) {
      console.error("خطأ غير متوقع في تسجيل الدخول:", error);
      setHasLoginError(true);
      setLoginErrorMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-md mx-auto p-4 pt-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center">
              أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول إلى حسابك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasLoginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ في تسجيل الدخول</AlertTitle>
                <AlertDescription>
                  {loginErrorMessage}
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="أدخل بريدك الإلكتروني" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>كلمة المرور</FormLabel>
                        <Link 
                          to="/forgot-password" 
                          className="text-xs text-primary hover:underline"
                        >
                          نسيت كلمة المرور؟
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="أدخل كلمة المرور" className="pl-10" {...field} />
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
                      جاري تسجيل الدخول...
                    </>
                  ) : 'تسجيل الدخول'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Separator className="my-2" />
            <div className="text-center text-sm">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary hover:underline inline-flex items-center">
                إنشاء حساب جديد
                <UserPlus className="mr-1 h-4 w-4" />
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
