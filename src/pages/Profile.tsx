
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, User, Mail, Key, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [userData, setUserData] = useState({
    id: '',
    email: '',
    username: '',
    fullName: '',
    avatarUrl: '',
  });
  
  const [stats, setStats] = useState({
    totalImages: 0,
    processedImages: 0,
    pendingImages: 0
  });
  
  useEffect(() => {
    if (user) {
      setUserData(prevData => ({
        ...prevData,
        id: user.id,
        email: user.email || '',
      }));
      
      // جلب بيانات المستخدم من جدول الملفات الشخصية
      const fetchUserProfile = async () => {
        try {
          setIsLoading(true);
          
          // جلب بيانات الملف الشخصي
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url, full_name')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            throw profileError;
          }
          
          if (profileData) {
            setUserData(prevData => ({
              ...prevData,
              username: profileData.username || '',
              fullName: profileData.full_name || '',
              avatarUrl: profileData.avatar_url || '',
            }));
          }
          
          // إحصائيات الصور
          const { data: imagesAll } = await supabase
            .from('images')
            .select('id, status')
            .eq('user_id', user.id);
          
          if (imagesAll) {
            const processedCount = imagesAll.filter(img => img.status === 'completed').length;
            const pendingCount = imagesAll.filter(img => img.status === 'pending').length;
            
            setStats({
              totalImages: imagesAll.length,
              processedImages: processedCount,
              pendingImages: pendingCount
            });
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات المستخدم:', error);
          toast({
            title: 'خطأ',
            description: 'تعذر جلب بيانات المستخدم',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserProfile();
    }
  }, [user, toast]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار ملف صورة صالح',
          variant: 'destructive',
        });
        return;
      }
      
      setUploadingAvatar(true);
      
      // تحميل الصورة إلى التخزين
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;
      
      // رفع الملف
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // الحصول على URL للصورة
      const { data } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (data) {
        const avatarUrl = data.publicUrl;
        
        // تحديث الملف الشخصي بعنوان URL للصورة الجديدة
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user?.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // تحديث حالة واجهة المستخدم
        setUserData(prevData => ({
          ...prevData,
          avatarUrl
        }));
        
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث صورة الملف الشخصي',
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الصورة:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحميل الصورة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: userData.username,
          full_name: userData.fullName
        })
        .eq('id', user?.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث معلومات الملف الشخصي',
      });
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto p-6 max-w-6xl">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* معلومات الملف الشخصي */}
            <Card className="md:col-span-1 apple-card">
              <CardHeader className="pb-4">
                <CardTitle className="apple-subheader text-center">الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    {userData.avatarUrl ? (
                      <AvatarImage src={userData.avatarUrl} alt={userData.username} />
                    ) : null}
                    <AvatarFallback className="text-2xl bg-muted">
                      {uploadingAvatar ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        userData.username?.substring(0, 2) || <User className="h-8 w-8" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 cursor-pointer bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-colors">
                    <input 
                      id="avatar-upload" 
                      type="file"
                      accept="image/*"
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                    <FileImage className="h-4 w-4" />
                  </label>
                </div>
                
                <div className="space-y-1 text-center">
                  <h3 className="font-medium text-lg">{userData.fullName || userData.username}</h3>
                  <p className="text-muted-foreground text-sm">{userData.email}</p>
                </div>
                
                <div className="w-full grid grid-cols-3 gap-2 pt-4">
                  <div className="text-center p-2">
                    <p className="text-2xl font-semibold">{stats.totalImages}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الصور</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-2xl font-semibold">{stats.processedImages}</p>
                    <p className="text-xs text-muted-foreground">معالجة</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-2xl font-semibold">{stats.pendingImages}</p>
                    <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pt-2">
                <Button variant="destructive" onClick={handleSignOut}>
                  تسجيل الخروج
                </Button>
              </CardFooter>
            </Card>

            {/* تعديل الملف الشخصي */}
            <Card className="md:col-span-2 apple-card">
              <CardHeader>
                <CardTitle className="apple-subheader">تعديل المعلومات الشخصية</CardTitle>
                <CardDescription>قم بتعديل المعلومات الشخصية الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">المعلومات الأساسية</TabsTrigger>
                    <TabsTrigger value="security">الأمان</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={userData.fullName}
                        onChange={handleInputChange}
                        placeholder="أدخل الاسم الكامل"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <Input
                        id="username"
                        name="username"
                        value={userData.username}
                        onChange={handleInputChange}
                        placeholder="أدخل اسم المستخدم"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
                    </div>
                    <Button 
                      onClick={handleUpdateProfile} 
                      className="w-full mt-4"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري التحديث...
                        </>
                      ) : 'حفظ التغييرات'}
                    </Button>
                  </TabsContent>
                  <TabsContent value="security" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <Button className="w-full mt-4">تغيير كلمة المرور</Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
