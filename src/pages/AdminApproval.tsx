import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { 
  CheckCircle, XCircle, User, Calendar as CalendarIcon, RefreshCw, Lock, Eye, EyeOff, 
  Clock, Shield, Edit, Save, Ban, CheckSquare, AlertCircle, UserCheck, UserX, UserPlus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// نوع بيانات المستخدم
interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  is_approved?: boolean;
  created_at?: string;
  subscription_plan?: string;
  account_status?: string;
  subscription_end_date?: string;
}

// نوع البيانات من جدول profiles
interface ProfileData {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_approved?: boolean | null;
  subscription_plan?: string | null;
  account_status?: string | null;
  subscription_end_date?: string | null;
  [key: string]: any;
}

const AdminApproval = () => {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // حالة تعديل المستخدم
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null);
  const [editedUserData, setEditedUserData] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [userToReset, setUserToReset] = useState<string | null>(null);

  // التحقق من وجود المستخدم وصلاحياته
  useEffect(() => {
    if (!user || !userProfile?.is_approved) {
      window.location.href = '/login';
    }
  }, [user, userProfile]);

  // جلب قائمة المستخدمين
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // جلب بيانات الملفات الشخصية
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        toast.error('خطأ في جلب بيانات الملفات الشخصية');
        console.error('Profiles error:', profilesError);
        return;
      }
      
      // جلب بيانات المستخدمين من auth.users من خلال RPC (وظيفة مخصصة في قاعدة البيانات)
      const { data: authUsersData, error: authUsersError } = await supabase.rpc('get_users_emails');
      
      if (authUsersError) {
        console.error('Auth users error:', authUsersError);
        // نستمر بالعمل مع البيانات المتاحة من الملفات الشخصية فقط
      }
      
      // إنشاء كائن للبحث السريع عن البريد الإلكتروني حسب معرف المستخدم
      const emailsMap: Record<string, string> = {};
      if (authUsersData) {
        authUsersData.forEach((user: {id: string, email: string}) => {
          emailsMap[user.id] = user.email;
        });
      }
      
      // تحويل بيانات الملفات الشخصية إلى قائمة المستخدمين
      const usersWithEmails = (profilesData || []).map((profile: ProfileData) => {
        return {
          id: profile.id,
          email: emailsMap[profile.id] || profile.username ? `${profile.username}@example.com` : 'unknown@example.com',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || '',
          is_approved: profile.is_approved || false,
          created_at: profile.created_at,
          subscription_plan: profile.subscription_plan || 'standard',
          account_status: profile.account_status || 'active',
          subscription_end_date: profile.subscription_end_date || null,
        };
      });
      
      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    if (user && userProfile?.is_approved) {
      fetchUsers();
    }
  }, [user, userProfile]);

  // وظائف الموافقة والرفض وتحديث البيانات

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
    try {
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

  // وظيفة تحديث حالة حساب المستخدم
  const updateAccountStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status })
        .eq('id', userId);
      
      if (error) {
        toast.error('فشل في تحديث حالة الحساب');
        return;
      }
      
      toast.success('تم تحديث حالة الحساب بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error updating account status:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الحساب');
    }
  };

  // وظيفة تحديث باقة الاشتراك
  const updateSubscriptionPlan = async (userId: string, plan: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_plan: plan })
        .eq('id', userId);
      
      if (error) {
        toast.error('فشل في تحديث باقة الاشتراك');
        return;
      }
      
      toast.success('تم تحديث باقة الاشتراك بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      toast.error('حدث خطأ أثناء تحديث باقة الاشتراك');
    }
  };

  // وظيفة تحديث تاريخ انتهاء الاشتراك
  const updateSubscriptionEndDate = async (userId: string, date: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_end_date: date })
        .eq('id', userId);
      
      if (error) {
        toast.error('فشل في تحديث تاريخ انتهاء الاشتراك');
        return;
      }
      
      toast.success('تم تحديث تاريخ انتهاء الاشتراك بنجاح');
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error updating subscription end date:', error);
      toast.error('حدث خطأ أثناء تحديث تاريخ انتهاء الاشتراك');
    }
  };

  // وظيفة إعادة تعيين كلمة المرور
  const resetUserPassword = async (userId: string, newPassword: string) => {
    setIsProcessing(true);
    try {
      // استدعاء وظيفة قاعدة البيانات المخصصة لتغيير كلمة المرور
      const { data, error } = await supabase.rpc('admin_update_user_password', {
        user_id: userId,
        new_password: newPassword
      });
      
      if (error) {
        toast.error('فشل في إعادة تعيين كلمة المرور');
        console.error('Reset password error:', error);
        return;
      }
      
      if (data) {
        toast.success('تم إعادة تعيين كلمة المرور بنجاح');
        setNewPassword('');
        setShowPassword(false);
      } else {
        toast.error('لم يتم العثور على المستخدم');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsProcessing(false);
      setShowConfirmReset(false);
      setUserToReset(null);
    }
  };

  // وظيفة تحديث بيانات المستخدم بالكامل
  const saveUserData = async () => {
    if (!editedUserData) return;
    
    setIsProcessing(true);
    try {
      // تحديث بيانات الملف الشخصي
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editedUserData.full_name,
          is_approved: editedUserData.is_approved,
          subscription_plan: editedUserData.subscription_plan,
          account_status: editedUserData.account_status,
          subscription_end_date: editedUserData.subscription_end_date
        })
        .eq('id', editedUserData.id);
      
      if (profileError) {
        toast.error('فشل في تحديث بيانات المستخدم');
        console.error('Profile update error:', profileError);
        return;
      }
      
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      
      // إعادة تعيين حالة التحرير
      setIsEditingUser(null);
      setEditedUserData(null);
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error('حدث خطأ أثناء حفظ بيانات المستخدم');
    } finally {
      setIsProcessing(false);
    }
  };

  // وظيفة بدء تحرير بيانات المستخدم
  const startEditing = (userData: UserProfile) => {
    setIsEditingUser(userData.id);
    setEditedUserData({...userData});
    if (userData.subscription_end_date) {
      setSelectedDate(new Date(userData.subscription_end_date));
    } else {
      setSelectedDate(undefined);
    }
  };

  // وظيفة إلغاء التحرير
  const cancelEditing = () => {
    setIsEditingUser(null);
    setEditedUserData(null);
    setSelectedDate(undefined);
  };

  // تحديث بيانات المستخدم أثناء التحرير
  const handleEditChange = (field: string, value: any) => {
    if (editedUserData) {
      setEditedUserData({
        ...editedUserData,
        [field]: value
      });
    }
  };

  // تنسيق التاريخ بالعربية
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: arSA });
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

  // ترجمة حالة الحساب
  const getAccountStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'suspended':
        return 'موقوف';
      case 'expired':
        return 'منتهي';
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

  // الحصول على لون حالة الحساب
  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-700';
      case 'suspended':
        return 'bg-orange-200 text-orange-700';
      case 'expired':
        return 'bg-red-200 text-red-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  // تصفية المستخدمين حسب الحالة
  const filterUsersByTab = (users: UserProfile[]) => {
    switch (activeTab) {
      case 'pending':
        return users.filter(user => !user.is_approved);
      case 'approved':
        return users.filter(user => user.is_approved);
      case 'all':
      default:
        return users;
    }
  };

  // تصفية المستخدمين حسب نوع الباقة
  const filterUsersByPlan = (users: UserProfile[]) => {
    if (filterPlan === 'all') return users;
    return users.filter(user => user.subscription_plan === filterPlan);
  };

  // تصفية المستخدمين حسب حالة الحساب
  const filterUsersByStatus = (users: UserProfile[]) => {
    if (filterStatus === 'all') return users;
    return users.filter(user => user.account_status === filterStatus);
  };

  // البحث عن المستخدمين
  const searchUsers = (users: UserProfile[]) => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      (user.full_name && user.full_name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  };

  // تطبيق جميع الفلاتر
  const getFilteredUsers = () => {
    let filteredUsers = [...users];
    filteredUsers = filterUsersByTab(filteredUsers);
    filteredUsers = filterUsersByPlan(filteredUsers);
    filteredUsers = filterUsersByStatus(filteredUsers);
    filteredUsers = searchUsers(filteredUsers);
    return filteredUsers;
  };

  // التحقق من الصلاحيات
  if (!user || !userProfile?.is_approved) {
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
                  إدارة حسابات المستخدمين والتحكم الكامل في الصلاحيات والاشتراكات
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
            {/* أدوات البحث والتصفية */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-auto md:flex-1">
                  <Input
                    placeholder="البحث عن مستخدم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-full md:w-[170px]">
                      <SelectValue placeholder="نوع الباقة" />
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
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[170px]">
                      <SelectValue placeholder="حالة الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="suspended">موقوف</SelectItem>
                        <SelectItem value="expired">منتهي</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Tabs 
              defaultValue="all" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <TabsList className="grid w-full md:w-[400px] grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    جميع المستخدمين ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    في الانتظار ({users.filter(u => !u.is_approved).length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    المعتمدون ({users.filter(u => u.is_approved).length})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all">
                {renderUsersTable(getFilteredUsers())}
              </TabsContent>
              
              <TabsContent value="pending">
                {renderUsersTable(getFilteredUsers())}
              </TabsContent>
              
              <TabsContent value="approved">
                {renderUsersTable(getFilteredUsers())}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* مربع حوار تأكيد إعادة تعيين كلمة المرور */}
      <AlertDialog open={showConfirmReset} onOpenChange={setShowConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إعادة تعيين كلمة المرور</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد إعادة تعيين كلمة المرور لهذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setUserToReset(null);
              setNewPassword('');
            }}>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (userToReset && newPassword) {
                  resetUserPassword(userToReset, newPassword);
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  جاري المعالجة...
                </>
              ) : 'تأكيد إعادة التعيين'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // وظيفة عرض جدول المستخدمين
  function renderUsersTable(users: UserProfile[]) {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (users.length === 0) {
      return (
        <div className="text-center p-8 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">لا توجد نتائج مطابقة للبحث أو الفلتر المحدد</p>
        </div>
      );
    }
    
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الباقة</TableHead>
              <TableHead>حالة الحساب</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead>معتمد</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                {isEditingUser === user.id ? (
                  // حالة تحرير المستخدم
                  <TableCell colSpan={8}>
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="edit-name">الاسم الكامل</Label>
                          <Input 
                            id="edit-name"
                            value={editedUserData?.full_name || ''} 
                            onChange={(e) => handleEditChange('full_name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                          <Input 
                            id="edit-email"
                            value={editedUserData?.email || ''} 
                            disabled
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-plan">نوع الباقة</Label>
                          <Select 
                            value={editedUserData?.subscription_plan || 'standard'} 
                            onValueChange={(value) => handleEditChange('subscription_plan', value)}
                          >
                            <SelectTrigger id="edit-plan" className="w-full">
                              <SelectValue placeholder="اختر الباقة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">الباقة العادية</SelectItem>
                              <SelectItem value="vip">الباقة VIP</SelectItem>
                              <SelectItem value="pro">الباقة المتميزة PRO</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-status">حالة الحساب</Label>
                          <Select 
                            value={editedUserData?.account_status || 'active'} 
                            onValueChange={(value) => handleEditChange('account_status', value)}
                          >
                            <SelectTrigger id="edit-status" className="w-full">
                              <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">نشط</SelectItem>
                              <SelectItem value="suspended">موقوف</SelectItem>
                              <SelectItem value="expired">منتهي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-approved">معتمد</Label>
                          <div className="flex items-center space-x-2 mt-2 justify-end">
                            <Label htmlFor="edit-approved-switch">
                              {editedUserData?.is_approved ? 'معتمد' : 'غير معتمد'}
                            </Label>
                            <Switch
                              id="edit-approved-switch"
                              checked={editedUserData?.is_approved || false}
                              onCheckedChange={(checked) => handleEditChange('is_approved', checked)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-end-date">تاريخ انتهاء الاشتراك</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-right font-normal mt-1"
                                id="edit-end-date"
                              >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, 'PPP', { locale: arSA }) : 'اختر تاريخًا'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  setSelectedDate(date);
                                  handleEditChange('subscription_end_date', date?.toISOString());
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 mt-6">
                        <div className="flex-1">
                          <Label htmlFor="new-password">تعيين كلمة مرور جديدة (اختياري)</Label>
                          <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="كلمة المرور الجديدة"
                              className="pr-10"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
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
                        </div>
                        <div className="flex-none self-end">
                          <Button 
                            variant="outline" 
                            className="w-full md:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (newPassword) {
                                setUserToReset(user.id);
                                setShowConfirmReset(true);
                              } else {
                                toast.error('يرجى إدخال كلمة المرور الجديدة');
                              }
                            }}
                            disabled={!newPassword}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            تغيير كلمة المرور
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={cancelEditing}>
                          إلغاء
                        </Button>
                        <Button onClick={saveUserData} disabled={isProcessing}>
                          {isProcessing ? (
                            <>
                              <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <Save className="mr-1 h-4 w-4" />
                              حفظ التغييرات
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                ) : (
                  // عرض بيانات المستخدم
                  <>
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
                      <Badge variant="outline" className={getAccountStatusColor(user.account_status || 'active')}>
                        {getAccountStatusLabel(user.account_status || 'active')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription_end_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatDate(user.subscription_end_date)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">غير محدد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_approved ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          معتمد
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          غير معتمد
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {user.created_at ? formatDate(user.created_at) : 'غير متوفر'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => startEditing(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          تعديل
                        </Button>
                        
                        {user.is_approved ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => rejectUser(user.id)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            إل
