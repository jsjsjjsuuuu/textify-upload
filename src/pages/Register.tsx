
import React, { useState } from 'react';
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
import { User, Mail, Check, KeyRound, Crown, Shield } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

const registerSchema = z.object({
  fullName: z.string().min(3, { message: 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل' }),
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صحيح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  confirmPassword: z.string().min(6, { message: 'تأكيد كلمة المرور مطلوب' }),
  subscriptionPlan: z.enum(['standard', 'vip', 'pro'], { 
    message: 'يرجى اختيار نوع الباقة' 
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface SubscriptionPlanOption {
  id: 'standard' | 'vip' | 'pro';
  title: string;
  description: string;
  icon: React.ReactNode;
  price: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { signUp, emailConfirmationSent } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const subscriptionPlans: SubscriptionPlanOption[] = [
    {
      id: 'standard',
      title: 'الباقة العادية',
      description: 'للاستخدام الأساسي',
      icon: <User className="h-4 w-4" />,
      price: 'مجاناً'
    },
    {
      id: 'vip',
      title: 'الباقة VIP',
      description: 'مزايا إضافية ودعم متميز',
      icon: <Crown className="h-4 w-4" />,
      price: '١٠ دولار / شهرياً'
    },
    {
      id: 'pro',
      title: 'الباقة المتميزة PRO',
      description: 'كل المزايا والدعم الشامل',
      icon: <Shield className="h-4 w-4" />,
      price: '٢٠ دولار / شهرياً'
    }
  ];

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      subscriptionPlan: 'standard',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { error, emailConfirmationSent } = await signUp(
        data.email, 
        data.password, 
        { 
          full_name: data.fullName,
          subscription_plan: data.subscriptionPlan
        }
      );
      
      if (!error && emailConfirmationSent) {
        // سيتم عرض رسالة التأكيد في AuthContext
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailConfirmationSent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container max-w-md mx-auto p-4 pt-10">
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">تم إرسال رسالة التأكيد</CardTitle>
              <CardDescription className="text-center">
                لقد أرسلنا رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق والنقر على الرابط لتأكيد حسابك. سيتم مراجعة حسابك من قبل المسؤول قبل تفعيله.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')} 
                className="w-full"
              >
                العودة إلى تسجيل الدخول
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
            <CardTitle className="text-2xl text-center">إنشاء حساب جديد</CardTitle>
            <CardDescription className="text-center">
              أدخل بياناتك الشخصية واختر الباقة المناسبة لإنشاء حساب جديد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="أدخل اسمك الكامل" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel>كلمة المرور</FormLabel>
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="أكد كلمة المرور" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-4" />
                
                <FormField
                  control={form.control}
                  name="subscriptionPlan"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>اختر نوع الباقة</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-3"
                        >
                          {subscriptionPlans.map((plan) => (
                            <div key={plan.id} className={`
                              flex items-center justify-between p-3 rounded-lg border-2 transition-all
                              ${field.value === plan.id 
                                ? 'bg-primary/5 border-primary'
                                : 'border-muted hover:border-muted-foreground/20'
                              }
                            `}>
                              <div className="flex items-center gap-3">
                                <RadioGroupItem value={plan.id} id={plan.id} />
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    {plan.icon}
                                    <span className="font-medium">{plan.title}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{plan.description}</span>
                                </div>
                              </div>
                              <div className="text-sm">{plan.price}</div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-primary hover:underline">
                تسجيل الدخول
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
