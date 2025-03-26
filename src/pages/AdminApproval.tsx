
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ar from 'date-fns/locale/ar-SA';
import { CheckCircle, XCircle, User, Calendar, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// نوع بيانات المستخدم
interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  is_approved?: boolean;
  created_at?: string;
  subscription_plan?: string;
}

const AdminApproval = () => {
  const { user, userProfile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [filterPlan, setFilterPlan] = useState('all');

  // التحقق من وجود المستخدم وصلاحياته
  useEffect(() => {
    if (!user || !userProfile?.isApproved) {
      window.location.href = '/login';
    }
  }, [user, userProfile]);

  // جلب قائمة المستخدمين
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // جلب المستخدمين من Supabase
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        toast.error('خطأ في جلب بيانات المستخدمين');
        console.error('Auth error:', authError);
        return;
      }
      
      // جلب بيانات الملفات الشخصية
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        toast.error('خطأ في جلب بيانات الملفات الشخصية');
        console.error('Profiles error:', profilesError);
        return;
      }
      
      // دمج بيانات المستخدمين مع ملفاتهم الشخصية
      const combinedUsers = authUsers.users.map(authUser => {
        const profile = profilesData.find(p => p.id === authUser.id) || {};
        return {
          id: authUser.id,
          email: authUser.email || '',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || '',
          is_approved: profile.is_approved || false,
          created_at: authUser.created_at || '',
          subscription_plan: profile.subscription_plan || 'standard',
        };
      });
      
      // فصل المستخدمين حسب حالة الموافقة
      const pending = combinedUsers.filter(u => !u.is_approved);
      const approved = combinedUsers.filter(u => u.is_approved);
      
      setPendingUsers(pending);
      setApprovedUsers(approved);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    if (user && userProfile?.isApproved) {
      fetchUsers();
    }
  }, [user, userProfile]);

  // وظيفة الموافقة على مستخدم
  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);
      
      if (error) {
        toast.error('فشل في الموافقة على المستخدم');
        return;
      }
      
      toast.success('تمت الموافقة على المستخدم بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('حدث خطأ أثناء الموافقة على المستخدم');
    }
  };

  // وظيفة رفض مستخدم
  const rejectUser = async (userId: string) => {
    // هنا يمكن إضافة تأكيد قبل الرفض
    try {
      // نقوم بتحديث حالة المستخدم إلى غير موافق عليه
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', userId);
      
      if (updateError) {
        toast.error('فشل في رفض المستخدم');
        return;
      }
      
      toast.success('تم رفض المستخدم بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('حدث خطأ أثناء رفض المستخدم');
    }
  };

  // تنسيق التاريخ بالعربية
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: ar });
    } catch (error) {
      return 'تاريخ غير صالح';
    }
  };

  // ترجمة نوع الباقة
  const getSubscriptionLabel = (plan: string) => {
    switch (plan) {
      case 'standard':
        return 'الباقة العادية';
      case 'vip':
        return 'الباقة VIP';
      case 'pro':
        return 'الباقة المتميزة PRO';
      default:
        return 'غير معروف';
    }
  };

  // الحصول على لون الباقة
  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'standard':
        return 'bg-gray-200 text-gray-700';
      case 'vip':
        return 'bg-amber-200 text-amber-700';
      case 'pro':
        return 'bg-blue-200 text-blue-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  // تصفية المستخدمين حسب نوع الباقة
  const filterUsersByPlan = (users: UserProfile[]) => {
    if (filterPlan === 'all') return users;
    return users.filter(user => user.subscription_plan === filterPlan);
  };

  // التحقق من الصلاحيات
  if (!user || !userProfile?.isApproved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">إدارة المستخدمين</CardTitle>
                <CardDescription>
                  إدارة طلبات التسجيل والموافقة على المستخدمين الجدد
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUsers} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="pending" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    طلبات الموافقة ({pendingUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">المستخدمون المعتمدون ({approvedUsers.length})</TabsTrigger>
                </TabsList>
                
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="تصفية حسب الباقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">جميع الباقات</SelectItem>
                      <SelectItem value="standard">الباقة العادية</SelectItem>
                      <SelectItem value="vip">الباقة VIP</SelectItem>
                      <SelectItem value="pro">الباقة المتميزة PRO</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <TabsContent value="pending">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : filterUsersByPlan(pendingUsers).length === 0 ? (
                  <div className="text-center p-8 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">لا توجد طلبات تسجيل جديدة في انتظار الموافقة</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
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
                        {filterUsersByPlan(pendingUsers).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={user.avatar_url || `https://avatar.iran.liara.run/public/${user.email}`} 
                                  alt={user.full_name || user.email}
                                />
                                <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{user.full_name || 'بدون اسم'}</span>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getSubscriptionColor(user.subscription_plan || 'standard')}>
                                {getSubscriptionLabel(user.subscription_plan || 'standard')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {user.created_at ? formatDate(user.created_at) : 'غير متوفر'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => approveUser(user.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  موافقة
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => rejectUser(user.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  رفض
                                </Button>
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
                ) : filterUsersByPlan(approvedUsers).length === 0 ? (
                  <div className="text-center p-8 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">لا يوجد مستخدمون معتمدون</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
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
                        {filterUsersByPlan(approvedUsers).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={user.avatar_url || `https://avatar.iran.liara.run/public/${user.email}`} 
                                  alt={user.full_name || user.email}
                                />
                                <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{user.full_name || 'بدون اسم'}</span>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getSubscriptionColor(user.subscription_plan || 'standard')}>
                                {getSubscriptionLabel(user.subscription_plan || 'standard')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {user.created_at ? formatDate(user.created_at) : 'غير متوفر'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"

                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => rejectUser(user.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                إلغاء الموافقة
                              </Button>
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
  );
};

export default AdminApproval;
