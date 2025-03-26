
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Lock, Loader2, User, UserPlus, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';

// إنشاء مخطط التحقق من صحة نموذج إضافة مستخدم
const addUserSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صالح' }),
  password: z.string().min(6, { message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' }),
  fullName: z.string().min(2, { message: 'يرجى إدخال الاسم الكامل' }),
});

// إنشاء مخطط التحقق من صحة نموذج تغيير كلمة المرور
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صالح' }),
  newPassword: z.string().min(6, { message: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل' }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const UserManagementTab: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // نموذج إضافة مستخدم جديد
  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  });

  // نموذج إعادة تعيين كلمة المرور
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      newPassword: '',
    },
  });

  // إضافة مستخدم جديد
  const onAddUserSubmit = async (data: AddUserFormValues) => {
    setIsLoading(true);
    try {
      // إنشاء المستخدم في Supabase
      const { error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // تأكيد البريد الإلكتروني تلقائيًا
        user_metadata: {
          full_name: data.fullName,
        },
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "تم بنجاح",
        description: `تم إضافة المستخدم ${data.email} بنجاح`,
      });
      
      addUserForm.reset();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة تعيين كلمة المرور
  const onResetPasswordSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      // البحث عن المستخدم أولاً للحصول على معرف المستخدم
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();
      
      if (userError || !userData) {
        throw new Error('لم يتم العثور على المستخدم');
      }
      
      // استخدام الوظيفة المخصصة لتحديث كلمة المرور
      const { data: result, error } = await supabase.rpc('admin_update_user_password', {
        user_id: userData.id,
        new_password: data.newPassword,
      });
      
      if (error || !result) {
        throw error || new Error('فشل تحديث كلمة المرور');
      }
      
      toast({
        title: "تم بنجاح",
        description: `تم تغيير كلمة المرور للمستخدم ${data.email} بنجاح`,
      });
      
      resetPasswordForm.reset();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدمين</CardTitle>
          <CardDescription>
            إضافة مستخدمين جدد وإدارة الحسابات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="add-user" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add-user" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة مستخدم
              </TabsTrigger>
              <TabsTrigger value="reset-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                تغيير كلمة المرور
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="add-user">
              <Form {...addUserForm}>
                <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={addUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="user@example.com"
                              className="pr-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addUserForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="الاسم الكامل"
                              className="pr-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addUserForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute left-3 top-3 text-muted-foreground"
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
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري إضافة المستخدم...
                      </>
                    ) : (
                      <>
                        <UserPlus className="ml-2 h-4 w-4" />
                        إضافة مستخدم جديد
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="reset-password">
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={resetPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="user@example.com"
                              className="pr-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resetPasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute left-3 top-3 text-muted-foreground"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              tabIndex={-1}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
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
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري تغيير كلمة المرور...
                      </>
                    ) : (
                      <>
                        <Lock className="ml-2 h-4 w-4" />
                        تغيير كلمة المرور
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Shield className="h-4 w-4 ml-1" />
            وصول المسؤولين فقط
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserManagementTab;
