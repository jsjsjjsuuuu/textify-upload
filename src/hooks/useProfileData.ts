import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

export interface UserData {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
}

export interface UserStats {
  totalImages: number;
  processedImages: number;
  pendingImages: number;
}

export const useProfileData = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({
    id: '',
    email: '',
    username: '',
    fullName: '',
    avatarUrl: '',
  });
  
  const [stats, setStats] = useState<UserStats>({
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
      
      fetchUserProfile();
    }
  }, [user, userProfile]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // محاولة تحديث الملف الشخصي من AuthContext أولاً
      await refreshUserProfile();
      
      // استخدام البيانات من كائن userProfile المتوفر من AuthContext
      if (userProfile) {
        console.log("تم الحصول على بيانات الملف الشخصي من AuthContext:", userProfile);
        
        setUserData(prevData => ({
          ...prevData,
          username: userProfile.username || '',
          fullName: userProfile.full_name || '',
          avatarUrl: userProfile.avatar_url || '',
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
      if (!files || files.length === 0 || !user) return;
      
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
      const filePath = `${user.id}/avatar.${fileExt}`;
      
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
          .eq('id', user.id);
        
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
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: userData.username,
          full_name: userData.fullName
        })
        .eq('id', user.id);
      
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

  return {
    userData,
    stats,
    isLoading,
    isUpdating,
    uploadingAvatar,
    handleInputChange,
    handleAvatarUpload,
    handleUpdateProfile,
    fetchUserProfile
  };
};
