
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
import { toast } from 'sonner';

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
  console.log("هل تم العثور على ملف المستخدم؟", !!userProfile);

  // التحقق من وجود مستخدم
  useEffect(() => {
    console.log("فحص حالة المستخدم:", user ? "موجود" : "غير موجود", 
                "الملف الشخصي:", userProfile ? "موجود" : "غير موجود",
                "الموافقة:", userProfile?.is_approved, 
                "المسؤول:", userProfile?.is_admin);
            
    if (user) {
      // إذا كان المستخدم مسجل الدخول وتم تحميل ملفه الشخصي
      if (userProfile) {
        // التحقق من صلاحيات المسؤول أولاً - المسؤولون يمكنهم الدخول حتى بدون موافقة
        if (userProfile.is_admin === true) {
          console.log("المستخدم مسؤول، جارِ التوجيه إلى الصفحة الرئيسية");
          navigate('/app');
          return;
        }
      
        // التحقق إذا كان المستخدم معتمداً
        if (userProfile.is_approved === undefined || userProfile.is_approved) {
          console.log("المستخدم مسجل الدخول ومعتمد، جارِ التوجيه إلى الصفحة الرئيسية");
          navigate('/app');
        } else {
          console.log("المستخدم مسجل الدخول لكن غير معتمد، البقاء في صفحة تسجيل الدخول");
          setHasLoginError(true);
          setLoginErrorMessage('حسابك قيد المراجعة. يرجى الانتظار حتى تتم الموافقة عليه من قبل المسؤول.');
        }
      } else if (session) {
        // إذا كان لدينا جلسة صالحة لكن لم يتم تحميل الملف الشخصي بعد
        console.log("المستخدم مسجل الدخول ولكن لم يتم تحميل الملف الشخصي بعد");
        // يمكننا توجيه المستخدم إلى الصفحة الرئيسية حتى في حالة عدم تحميل الملف الشخصي
        navigate('/app');
      }
    }
  }, [user, userProfile, session, navigate]);

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
      console.log("إرسال بيانات تسجيل الدخول:", { email: data.email, password: "***مخفي***" });
      
      const { error, user: authUser } = await signIn(data.email, data.password);
      
      console.log("نتيجة تسجيل الدخول:", error ? `فشل: ${error.message}` : "نجاح", "المستخدم:", authUser || "لا يوجد");
      
      if (error) {
        setHasLoginError(true);
        
        // ترجمة رسائل الخطأ للعربية
        if (error.message && error.message.includes('Invalid login credentials')) {
          setLoginErrorMessage('بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
          toast.error('بيانات تسجيل الدخول غير صحيحة');
        } else if (error.message && error.message.includes('Email not confirmed')) {
          setLoginErrorMessage('البريد الإلكتروني غير مؤكد. يرجى تفقد بريدك الإلكتروني والنقر على رابط التأكيد.');
          toast.error('البريد الإلكتروني غير مؤكد');
        } else if (error.message && error.message.toLowerCase().includes('rate limit')) {
          setLoginErrorMessage('تم تجاوز الحد المسموح به لمحاولات تسجيل الدخول. يرجى المحاولة مرة أخرى بعد بضع دقائق.');
          toast.error('تم تجاوز الحد المسموح به لمحاولات تسجيل الدخول');
        } else {
          setLoginErrorMessage(error.message || 'حدث خطأ أثناء تسجيل الدخول.');
          toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
        }
      } else if (!authUser) {
        setHasLoginError(true);
        setLoginErrorMessage('حدث خطأ غير متوقع. لم يتم العثور على بيانات المستخدم.');
        toast.error('حدث خطأ غير متوقع');
      } else {
        // نجاح تسجيل الدخول، عرض إشعار النجاح
        toast.success('تم تسجيل الدخول بنجاح');
        console.log("تم تسجيل الدخول بنجاح، جاري التحقق من حالة الاعتماد والصلاحيات");
      
        // مباشرة بعد تسجيل الدخول بنجاح، سيتم تحديث الحالة وسيقوم useEffect بالتوجيه المناسب
      }
    } catch (error: any) {
      console.error("خطأ غير متوقع في تسجيل الدخول:", error);
      setHasLoginError(true);
      setLoginErrorMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.');
      toast.error('حدث خطأ غير متوقع');
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
