
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صحيح' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("إرسال طلب استعادة كلمة المرور للبريد:", data.email);
      const { error, sent } = await forgotPassword(data.email);
      
      if (error) {
        console.error("خطأ في إرسال طلب استعادة كلمة المرور:", error.message);
        
        // ترجمة رسائل الخطأ الشائعة
        if (error.message.includes("Email not found")) {
          setError("لم يتم العثور على هذا البريد الإلكتروني في قاعدة البيانات. يرجى التأكد من البريد الإلكتروني أو التسجيل للحصول على حساب جديد.");
        } else if (error.message.includes("rate limit")) {
          setError("لقد تجاوزت الحد المسموح به لعدد المحاولات. يرجى الانتظار قبل المحاولة مرة أخرى.");
        } else {
          setError(error.message);
        }
      } else if (sent) {
        console.log("تم إرسال رابط استعادة كلمة المرور بنجاح");
        setEmailSent(true);
      }
    } catch (error: any) {
      console.error("خطأ غير متوقع:", error);
      setError(error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
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
            {emailSent ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">تم إرسال رابط استعادة كلمة المرور</CardTitle>
                <CardDescription className="text-center">
                  لقد أرسلنا رابط استعادة كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من بريدك واتباع التعليمات لإعادة تعيين كلمة المرور الخاصة بك.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl text-center">استعادة كلمة المرور</CardTitle>
                <CardDescription className="text-center">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
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
            
            {!emailSent && (
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
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري إرسال الرابط...
                      </>
                    ) : 'إرسال رابط استعادة كلمة المرور'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button variant="ghost" asChild className="mt-2">
              <Link to="/login" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                العودة إلى تسجيل الدخول
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
