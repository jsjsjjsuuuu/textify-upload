
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserEditForm from "@/components/admin/UserEditForm";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Clock, Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/utils/dateFormatter";

interface UserDetails {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  phone_number?: string;
  subscription_plan?: string;
  avatar_url?: string;
  last_sign_in_at?: string;
}

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // التحقق من صلاحيات المسؤول
    if (userProfile) {
      setIsAdmin(userProfile.is_admin === true);
      if (!userProfile.is_admin) {
        navigate('/');
      }
    }

    const fetchUserDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // استرداد بيانات المستخدم من جدول الملفات الشخصية
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError('لم يتم العثور على المستخدم');
        } else {
          setUser(data as UserDetails);
        }
      } catch (err: any) {
        console.error('خطأ في استرداد بيانات المستخدم:', err);
        setError(err.message || 'حدث خطأ أثناء استرداد بيانات المستخدم');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, userProfile, navigate]);

  const handleGoBack = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex justify-center items-center h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل بيانات المستخدم...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 max-w-4xl">
          <Button onClick={handleGoBack} variant="outline" className="mb-4 flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى لوحة الإدارة
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-6">
                <AlertTriangle className="h-16 w-16 text-destructive opacity-80 mb-4" />
                <h2 className="text-xl font-semibold">خطأ في تحميل بيانات المستخدم</h2>
                <p className="text-muted-foreground mt-2">{error || 'لم يتم العثور على المستخدم'}</p>
                <Button onClick={handleGoBack} className="mt-4">
                  العودة إلى لوحة الإدارة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto p-6 max-w-4xl">
        <Button onClick={handleGoBack} variant="outline" className="mb-4 flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          العودة إلى لوحة الإدارة
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* بطاقة معلومات المستخدم */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">معلومات المستخدم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="صورة المستخدم" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <User className="h-12 w-12 text-primary/60" />
                  )}
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-medium">{user.full_name || 'بدون اسم'}</h2>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">الحالة</span>
                  {user.is_approved ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      معتمد
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600 text-sm">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      بانتظار الموافقة
                    </span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">المسؤول</span>
                  {user.is_admin ? (
                    <span className="flex items-center text-blue-600 text-sm">
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      نعم
                    </span>
                  ) : (
                    <span className="text-sm">لا</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">تاريخ التسجيل</span>
                  <span className="text-sm">{formatDate(user.created_at)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">آخر تسجيل دخول</span>
                  <span className="text-sm">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'غير متوفر'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">الباقة</span>
                  <span className="text-sm">{user.subscription_plan || 'الباقة الأساسية'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* علامات التبويب للتعديل والإحصائيات */}
          <div className="md:col-span-2">
            <Tabs defaultValue="edit">
              <TabsList className="w-full">
                <TabsTrigger value="edit" className="flex-1">تعديل البيانات</TabsTrigger>
                <TabsTrigger value="stats" className="flex-1">إحصائيات</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>تعديل بيانات المستخدم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserEditForm userData={user} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات المستخدم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">الإحصائيات غير متوفرة حالياً. سيتم إضافتها قريباً.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
