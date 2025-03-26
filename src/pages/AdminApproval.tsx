
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, User, Crown, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from '@/utils/dateFormatter';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subscription_plan: 'standard' | 'vip' | 'pro';
  is_approved: boolean;
  avatar_url: string | null;
}

const AdminApproval = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // التحقق مما إذا كان المستخدم الحالي هو المسؤول
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      // في الوضع الحالي، سنجعل أول مستخدم في النظام هو المسؤول
      // في تطبيق حقيقي، يجب أن يكون هناك جدول خاص للأدوار
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      if (error) {
        toast({
          title: "خطأ",
          description: "فشل في التحقق من حالة المسؤول",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      
      // إذا كان المستخدم الحالي هو أول مستخدم، فهو المسؤول
      if (data.id === user.id) {
        setIsAdmin(true);
        fetchUsers();
      } else {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية الوصول إلى هذه الصفحة",
          variant: "destructive",
        });
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [user, navigate, toast]);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // استدعاء المستخدمين المعلقين
      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('*, auth_users:id(email)')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      
      if (pendingError) throw pendingError;
      
      // استدعاء المستخدمين المعتمدين
      const { data: approvedData, error: approvedError } = await supabase
        .from('profiles')
        .select('*, auth_users:id(email)')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (approvedError) throw approvedError;
      
      // تحويل البيانات إلى الشكل المطلوب
      const formatProfileData = (data: any[]): UserProfile[] => {
        return data.map(item => ({
          id: item.id,
          email: item.auth_users?.email || 'غير متوفر',
          full_name: item.full_name || 'غير متوفر',
          created_at: item.created_at,
          subscription_plan: item.subscription_plan || 'standard',
          is_approved: item.is_approved,
          avatar_url: item.avatar_url
        }));
      };
      
      setPendingUsers(formatProfileData(pendingData || []));
      setApprovedUsers(formatProfileData(approvedData || []));
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب قائمة المستخدمين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);
      
      if (error) throw error;
      
      // تحديث القوائم
      const updatedUser = pendingUsers.find(user => user.id === userId);
      if (updatedUser) {
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
        setApprovedUsers([{ ...updatedUser, is_approved: true }, ...approvedUsers]);
      }
      
      toast({
        title: "تمت الموافقة",
        description: "تمت الموافقة على المستخدم بنجاح",
      });
    } catch (error) {
      console.error('خطأ في الموافقة على المستخدم:', error);
      toast({
        title: "خطأ",
        description: "فشل في الموافقة على المستخدم",
        variant: "destructive",
      });
    }
  };
  
  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', userId);
      
      if (error) throw error;
      
      // تحديث القوائم
      const updatedUser = approvedUsers.find(user => user.id === userId);
      if (updatedUser) {
        setApprovedUsers(approvedUsers.filter(user => user.id !== userId));
        setPendingUsers([{ ...updatedUser, is_approved: false }, ...pendingUsers]);
      }
      
      toast({
        title: "تم الرفض",
        description: "تم رفض المستخدم بنجاح",
      });
    } catch (error) {
      console.error('خطأ في رفض المستخدم:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفض المستخدم",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateSubscription = async (userId: string, plan: 'standard' | 'vip' | 'pro') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_plan: plan })
        .eq('id', userId);
      
      if (error) throw error;
      
      // تحديث القوائم
      if (activeTab === 'pending') {
        setPendingUsers(pendingUsers.map(user => 
          user.id === userId ? { ...user, subscription_plan: plan } : user
        ));
      } else {
        setApprovedUsers(approvedUsers.map(user => 
          user.id === userId ? { ...user, subscription_plan: plan } : user
        ));
      }
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث باقة المستخدم بنجاح",
      });
    } catch (error) {
      console.error('خطأ في تحديث باقة المستخدم:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث باقة المستخدم",
        variant: "destructive",
      });
    }
  };
  
  const getSubscriptionBadge = (plan: string) => {
    switch (plan) {
      case 'standard':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <User className="mr-1 h-3 w-3" />
            عادية
          </Badge>
        );
      case 'vip':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Crown className="mr-1 h-3 w-3" />
            VIP
          </Badge>
        );
      case 'pro':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Shield className="mr-1 h-3 w-3" />
            PRO
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="mr-1 h-3 w-3" />
            {plan}
          </Badge>
        );
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container max-w-3xl mx-auto p-6 mt-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">جاري التحميل...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-6xl mx-auto p-6 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">إدارة المستخدمين</CardTitle>
            <CardDescription>
              قم بمراجعة والموافقة على طلبات المستخدمين الجدد وإدارة الباقات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-6 border-b">
              <Button
                variant={activeTab === 'pending' ? 'default' : 'ghost'}
                className="relative rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary px-4"
                onClick={() => setActiveTab('pending')}
              >
                قيد الانتظار
                {pendingUsers.length > 0 && (
                  <Badge className="mr-2 bg-primary">{pendingUsers.length}</Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'approved' ? 'default' : 'ghost'}
                className="relative rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary px-4"
                onClick={() => setActiveTab('approved')}
              >
                المعتمدين
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div>
                {activeTab === 'pending' ? (
                  pendingUsers.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      لا توجد طلبات معلقة في الوقت الحالي
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">المستخدم</TableHead>
                          <TableHead>البريد الإلكتروني</TableHead>
                          <TableHead>تاريخ التسجيل</TableHead>
                          <TableHead>الباقة</TableHead>
                          <TableHead className="text-left">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.full_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>
                              <Select
                                defaultValue={user.subscription_plan}
                                onValueChange={(value) => handleUpdateSubscription(user.id, value as any)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue>
                                    {getSubscriptionBadge(user.subscription_plan)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">
                                    <div className="flex items-center">
                                      <User className="mr-2 h-4 w-4" />
                                      <span>عادية</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="vip">
                                    <div className="flex items-center">
                                      <Crown className="mr-2 h-4 w-4" />
                                      <span>VIP</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pro">
                                    <div className="flex items-center">
                                      <Shield className="mr-2 h-4 w-4" />
                                      <span>PRO</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                                  onClick={() => handleApproveUser(user.id)}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  موافقة
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                ) : (
                  approvedUsers.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      لا يوجد مستخدمين معتمدين في الوقت الحالي
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">المستخدم</TableHead>
                          <TableHead>البريد الإلكتروني</TableHead>
                          <TableHead>تاريخ التسجيل</TableHead>
                          <TableHead>الباقة</TableHead>
                          <TableHead className="text-left">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.full_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>
                              <Select
                                defaultValue={user.subscription_plan}
                                onValueChange={(value) => handleUpdateSubscription(user.id, value as any)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue>
                                    {getSubscriptionBadge(user.subscription_plan)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">
                                    <div className="flex items-center">
                                      <User className="mr-2 h-4 w-4" />
                                      <span>عادية</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="vip">
                                    <div className="flex items-center">
                                      <Crown className="mr-2 h-4 w-4" />
                                      <span>VIP</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pro">
                                    <div className="flex items-center">
                                      <Shield className="mr-2 h-4 w-4" />
                                      <span>PRO</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                                  onClick={() => handleRejectUser(user.id)}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  إلغاء الاعتماد
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminApproval;
