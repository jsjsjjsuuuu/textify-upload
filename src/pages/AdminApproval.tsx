
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Check, X, RotateCcw, AlertCircle, User, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// تعريف تنسيق التاريخ 
const DATE_FORMAT = 'yyyy-MM-dd HH:mm';

// تعريف نوع المستخدم
interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url?: string;
    is_approved: boolean;
    is_admin: boolean;
    subscription_plan: string;
    updated_at: string;
  }
}

const AdminApproval = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserWithProfile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserWithProfile[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  // إعادة التوجيه إذا لم يكن المستخدم مسؤولاً
  useEffect(() => {
    if (userProfile && !userProfile.isApproved) {
      navigate('/');
    }
  }, [userProfile, navigate]);

  // جلب بيانات المستخدمين
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // جلب جميع المستخدمين مع ملفاتهم الشخصية
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          avatar_url,
          is_approved,
          is_admin,
          subscription_plan,
          updated_at,
          users:user_id (
            id,
            email,
            created_at
          )
        `);

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "خطأ في جلب بيانات المستخدمين",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // تحويل البيانات إلى الشكل المطلوب
      const formattedUsers: UserWithProfile[] = data.map((profile: any) => {
        const user = profile.users;
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          profile: {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            is_approved: profile.is_approved,
            is_admin: profile.is_admin,
            subscription_plan: profile.subscription_plan,
            updated_at: profile.updated_at,
          }
        };
      });

      setUsers(formattedUsers);
      
      // فصل المستخدمين حسب حالة الموافقة
      const pending = formattedUsers.filter(user => !user.profile?.is_approved);
      const approved = formattedUsers.filter(user => user.profile?.is_approved);
      
      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات المستخدمين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // تحديث حالة الموافقة للمستخدم
  const updateApprovalStatus = async (userId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: approve })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // تحديث القائمة المحلية
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userId && user.profile) {
            return {
              ...user,
              profile: {
                ...user.profile,
                is_approved: approve
              }
            };
          }
          return user;
        })
      );

      // تحديث قوائم المستخدمين المعلقين والموافق عليهم
      if (approve) {
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
        setApprovedUsers(prev => [
          ...prev, 
          ...users.filter(user => user.id === userId)
        ]);
      } else {
        setApprovedUsers(prev => prev.filter(user => user.id !== userId));
        setPendingUsers(prev => [
          ...prev, 
          ...users.filter(user => user.id === userId)
        ]);
      }

      toast({
        title: approve ? "تمت الموافقة على المستخدم" : "تم رفض المستخدم",
        description: approve ? "يمكن للمستخدم الآن تسجيل الدخول واستخدام النظام" : "تم إلغاء وصول المستخدم إلى النظام",
        variant: approve ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث حالة المستخدم",
        variant: "destructive",
      });
    }
  };

  // ترقية مستخدم إلى مسؤول
  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // تحديث القائمة المحلية
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userId && user.profile) {
            return {
              ...user,
              profile: {
                ...user.profile,
                is_admin: true
              }
            };
          }
          return user;
        })
      );

      // تحديث قائمة المستخدمين الموافق عليهم
      setApprovedUsers(prev => 
        prev.map(user => {
          if (user.id === userId && user.profile) {
            return {
              ...user,
              profile: {
                ...user.profile,
                is_admin: true
              }
            };
          }
          return user;
        })
      );

      toast({
        title: "تمت ترقية المستخدم",
        description: "تم منح المستخدم صلاحيات المسؤول",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error promoting user to admin:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive",
      });
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, DATE_FORMAT);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  // تحويل خطة الاشتراك إلى نص عربي
  const getSubscriptionPlanText = (plan: string) => {
    switch(plan) {
      case 'standard':
        return 'الباقة العادية';
      case 'vip':
        return 'باقة VIP';
      case 'pro':
        return 'باقة PRO';
      default:
        return 'غير معروفة';
    }
  };

  // الحصول على لون الباقة
  const getSubscriptionPlanColor = (plan: string) => {
    switch(plan) {
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto p-4 pt-6">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">إدارة المستخدمين</CardTitle>
                  <CardDescription>
                    مراجعة وإدارة طلبات التسجيل والمستخدمين في النظام
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUsers}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    الطلبات المعلقة ({pendingUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    المستخدمون المعتمدون ({approvedUsers.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending">
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد طلبات معلقة في الوقت الحالي
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableCaption>قائمة بطلبات التسجيل المعلقة</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>البريد الإلكتروني</TableHead>
                            <TableHead>الباقة</TableHead>
                            <TableHead>تاريخ التسجيل</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8 ml-2">
                                    <AvatarImage src={user.profile?.avatar_url || `https://avatar.iran.liara.run/public/${user.email}`} />
                                    <AvatarFallback>{user.profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{user.profile?.full_name || 'غير محدد'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                {user.profile?.subscription_plan && (
                                  <span className={`px-2 py-1 rounded-full text-xs ${getSubscriptionPlanColor(user.profile.subscription_plan)}`}>
                                    {getSubscriptionPlanText(user.profile.subscription_plan)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(user.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateApprovalStatus(user.id, true)}
                                    className="flex items-center gap-1 text-green-600"
                                  >
                                    <Check className="h-4 w-4" />
                                    قبول
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 text-red-600"
                                      >
                                        <X className="h-4 w-4" />
                                        رفض
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>هل أنت متأكد من رفض هذا المستخدم؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          سيتم منع المستخدم من الوصول إلى النظام. يمكنك إلغاء هذا الإجراء لاحقًا.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => updateApprovalStatus(user.id, false)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          تأكيد الرفض
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="approved">
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : approvedUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمين معتمدين في النظام
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableCaption>قائمة المستخدمين المعتمدين في النظام</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>البريد الإلكتروني</TableHead>
                            <TableHead>الباقة</TableHead>
                            <TableHead>تاريخ التسجيل</TableHead>
                            <TableHead>الصلاحية</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8 ml-2">
                                    <AvatarImage src={user.profile?.avatar_url || `https://avatar.iran.liara.run/public/${user.email}`} />
                                    <AvatarFallback>{user.profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{user.profile?.full_name || 'غير محدد'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                {user.profile?.subscription_plan && (
                                  <span className={`px-2 py-1 rounded-full text-xs ${getSubscriptionPlanColor(user.profile.subscription_plan)}`}>
                                    {getSubscriptionPlanText(user.profile.subscription_plan)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(user.created_at)}</TableCell>
                              <TableCell>
                                {user.profile?.is_admin ? (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    <Shield className="h-3 w-3 mr-1" /> مسؤول
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                    مستخدم
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {!user.profile?.is_admin && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 text-yellow-600"
                                        >
                                          <Shield className="h-4 w-4" />
                                          ترقية لمسؤول
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>ترقية المستخدم إلى مسؤول</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            هذا سيمنح المستخدم صلاحيات كاملة للوصول إلى كافة أجزاء النظام بما في ذلك إدارة المستخدمين. هل أنت متأكد؟
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => promoteToAdmin(user.id)}
                                            className="bg-yellow-600 hover:bg-yellow-700"
                                          >
                                            تأكيد الترقية
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 text-red-600"
                                      >
                                        <X className="h-4 w-4" />
                                        تعليق
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>تعليق حساب المستخدم</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          سيتم منع المستخدم من الوصول إلى النظام. هل أنت متأكد من هذا الإجراء؟
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => updateApprovalStatus(user.id, false)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          تأكيد التعليق
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminApproval;
