
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Edit, UserCircle } from 'lucide-react';

interface Profile {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: null,
    username: null,
    avatar_url: null,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        if (!user) return;

        // تحقق من وجود العمود في الجدول أولا
        const { data: columnData, error: columnError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);

        if (columnError) {
          console.error('خطأ في التحقق من أعمدة الجدول:', columnError);
          // عدم إظهار خطأ للمستخدم، فقط استمر بتحميل ما يمكن تحميله
        }

        // تحقق مما إذا كان العمود موجودًا في البيانات التي تم استرجاعها
        const hasFullNameColumn = columnData && columnData.length > 0 && 'full_name' in columnData[0];
        const hasUsernameColumn = columnData && columnData.length > 0 && 'username' in columnData[0];
        const hasAvatarUrlColumn = columnData && columnData.length > 0 && 'avatar_url' in columnData[0];

        // بناء استعلام SQL ديناميكيًا بناءً على الأعمدة المتاحة
        let query = supabase
          .from('profiles')
          .select('id');

        if (hasFullNameColumn) query = query.select('full_name');
        if (hasUsernameColumn) query = query.select('username');
        if (hasAvatarUrlColumn) query = query.select('avatar_url');

        const { data, error } = await query
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile({
          full_name: hasFullNameColumn ? data?.full_name || null : null,
          username: hasUsernameColumn ? data?.username || null : null,
          avatar_url: hasAvatarUrlColumn ? data?.avatar_url || null : null,
        });
      } catch (error: any) {
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء تحميل الملف الشخصي',
          variant: 'destructive',
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, toast]);

  const updateProfile = async () => {
    try {
      setUpdating(true);
      if (!user) return;

      // تحقق من وجود العمود في الجدول أولا
      const { data: columnData, error: columnError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (columnError) {
        throw columnError;
      }

      // تحقق مما إذا كان العمود موجودًا في البيانات التي تم استرجاعها
      const hasFullNameColumn = columnData && columnData.length > 0 && 'full_name' in columnData[0];
      const hasUsernameColumn = columnData && columnData.length > 0 && 'username' in columnData[0];

      // إعداد البيانات للتحديث
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (hasFullNameColumn) updateData.full_name = profile.full_name;
      if (hasUsernameColumn) updateData.username = profile.username;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الملف الشخصي بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('يرجى تحديد صورة للتحميل.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // تحقق من وجود العمود avatar_url
      const { data: columnData, error: columnError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (columnError) {
        throw columnError;
      }

      const hasAvatarUrlColumn = columnData && columnData.length > 0 && 'avatar_url' in columnData[0];
      
      if (!hasAvatarUrlColumn) {
        throw new Error('عمود avatar_url غير موجود في جدول profiles');
      }
        
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setProfile({
        ...profile,
        avatar_url: data.publicUrl,
      });
      
      toast({
        title: 'تم التحميل',
        description: 'تم تحميل الصورة بنجاح',
      });
      
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (profile.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    
    return 'مس';
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-md mx-auto p-4 pt-10">
        <Card className="w-full border rounded-xl shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/20 pb-8">
            <CardTitle className="text-2xl text-center">الملف الشخصي</CardTitle>
            <CardDescription className="text-center">
              إدارة معلومات حسابك
            </CardDescription>
            <div className="flex justify-center mt-8">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.username || 'صورة المستخدم'} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="bg-primary rounded-full p-2 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
                      <Edit className="h-4 w-4" />
                    </div>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={uploadAvatar}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>
            {uploading && (
              <div className="flex justify-center mt-2">
                <span className="text-sm text-muted-foreground">جاري تحميل الصورة...</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
                  <Input id="email" value={user?.email || ''} disabled className="bg-muted/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">الاسم الكامل</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    className="focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={profile.username || ''}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    placeholder="أدخل اسم المستخدم"
                    className="focus:border-primary"
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-6">
            <Button 
              onClick={updateProfile} 
              disabled={loading || updating} 
              className="w-full rounded-full"
            >
              {updating ? 'جاري التحديث...' : 'تحديث الملف الشخصي'}
              {!updating && <Check className="mr-2 h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="w-full rounded-full border-destructive text-destructive hover:bg-destructive/10"
            >
              تسجيل الخروج
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
