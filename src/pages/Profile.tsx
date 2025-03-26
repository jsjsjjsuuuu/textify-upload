
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

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    username: '',
    avatar_url: null,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile({
            username: data.username,
            avatar_url: data.avatar_url,
          });
        }
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

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          updated_at: new Date().toISOString(), // تم تغييرها من كائن Date إلى نص ISO
        })
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-md mx-auto p-4 pt-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">الملف الشخصي</CardTitle>
            <CardDescription className="text-center">
              إدارة معلومات حسابك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={profile.username || ''}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              onClick={updateProfile} 
              disabled={loading || updating} 
              className="w-full"
            >
              {updating ? 'جاري التحديث...' : 'تحديث الملف الشخصي'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSignOut} 
              className="w-full"
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
