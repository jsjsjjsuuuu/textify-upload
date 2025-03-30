
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Lock, Loader2, User, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserManagement } from '@/hooks/useUserManagement';

// إنشاء مخطط التحقق من صحة نموذج إضافة مستخدم
const addUserSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صالح' }),
  password: z.string().min(6, { message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' }),
  fullName: z.string().min(2, { message: 'يرجى إدخال الاسم الكامل' }),
  isAdmin: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  subscriptionPlan: z.string().optional(),
});

// إنشاء مخطط التحقق من صحة نموذج تغيير كلمة المرور
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صالح' }),
  newPassword: z.string().min(6, { message: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل' }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const AdminUserManagementTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState('standard');
  
  // استخدام hook إدارة المستخدمين للوصول للوظائف
  const { addNewUser, resetUserPassword, fetchUsers } = useUserManagement();

  // نموذج إضافة مستخدم جديد
  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      isAdmin: false,
      isApproved: false,
      subscriptionPlan: 'standard'
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

  // تحميل المستخدمين عند تحميل المكون
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // إضافة مستخدم جديد
  const onAddUserSubmit = async (data: AddUserFormValues) => {
    setIsLoading(true);
    try {
      console.log("محاولة إضافة مستخدم جديد:", data);
      
      const success = await addNewUser(
        data.email,
        data.password,
        data.fullName,
        isAdmin,
        isApproved,
        subscriptionPlan
      );
      
      if (success) {
        toast.success(`تم إضافة المستخدم ${data.email} بنجاح`);
        
        addUserForm.reset();
        setIsAdmin(false);
        setIsApproved(false);
        setSubscriptionPlan('standard');
      }
    } catch (error: any) {
      console.error("خطأ أثناء إضافة المستخدم:", error.message);
      
      toast.error(error.message || "حدث خطأ أثناء إضافة المستخدم");
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة تعيين كلمة المرور
  const onResetPasswordSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      // البحث عن معرف المستخدم باستخدام البريد الإلكتروني
      const { data: users, error: searchError } = await fetch(`/api/get-user-id?email=${encodeURIComponent(data.email)}`).then(res => res.json());
      
      if (searchError) {
        throw new Error(searchError);
      }
      
      if (!users || users.length === 0) {
        throw new Error('لم يتم العثور على المستخدم');
      }
      
      const userId = users[0].id;
      
      // استخدام وظيفة إعادة تعيين كلمة المرور
      const success = await resetUserPassword(userId, data.newPassword);
      
      if (success) {
        toast.success(`تم تغيير كلمة المرور للمستخدم ${data.email} بنجاح`);
        
        resetPasswordForm.reset();
      } else {
        throw new Error('فشل في إعادة تعيين كلمة المرور');
      }
    } catch (error: any) {
      console.error("خطأ أثناء تغيير كلمة المرور:", error.message);
      
      toast.error(error.message || "حدث خطأ أثناء تغيير كلمة المرور");
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>نوع الحساب</Label>
                      <Select 
                        value={isAdmin ? "admin" : "user"} 
                        onValueChange={(value) => {
                          setIsAdmin(value === "admin");
                          addUserForm.setValue("isAdmin", value === "admin");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الحساب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">مستخدم عادي</SelectItem>
                          <SelectItem value="admin">مسؤول النظام</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>حالة الحساب</Label>
                      <Select 
                        value={isApproved ? "approved" : "pending"} 
                        onValueChange={(value) => {
                          setIsApproved(value === "approved");
                          addUserForm.setValue("isApproved", value === "approved");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة الحساب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="approved">معتمد</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>نوع الاشتراك</Label>
                      <Select 
                        value={subscriptionPlan} 
                        onValueChange={(value) => {
                          setSubscriptionPlan(value);
                          addUserForm.setValue("subscriptionPlan", value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الاشتراك" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">اشتراك عادي</SelectItem>
                          <SelectItem value="pro">اشتراك متميز</SelectItem>
                          <SelectItem value="vip">اشتراك VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
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

export default AdminUserManagementTab;
