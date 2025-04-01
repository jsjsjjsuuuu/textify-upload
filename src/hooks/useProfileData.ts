
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/UserProfile';

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
  
  // إضافة حالة لمعلومات الباقة
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    plan: 'standard',
    dailyLimit: 3,
    currentUsage: 0,
    remainingUploads: 3,
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
        
        // تحديث معلومات الباقة
        setSubscriptionInfo(prev => ({
          ...prev,
          plan: userProfile.subscription_plan || 'standard',
          dailyLimit: userProfile.daily_image_limit || 3,
        }));
      }
      
      // الحصول على عدد التحميلات اليومية الحالية
      const { data: uploadCountData } = await supabase.rpc(
        'get_user_daily_upload_count',
        { user_id_param: user.id }
      );
      
      // تحديث معلومات الاستخدام
      if (typeof uploadCountData === 'number') {
        const dailyLimit = userProfile?.daily_image_limit || 3;
        setSubscriptionInfo(prev => ({
          ...prev,
          currentUsage: uploadCountData,
          remainingUploads: Math.max(0, dailyLimit - uploadCountData),
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
  
  // وظيفة لتحديث باقة المستخدم
  const updateSubscriptionPlan = async (newPlan: string) => {
    if (!user) return false;
    
    try {
      setIsUpdating(true);
      
      // تحديد الحد اليومي الجديد
      let newDailyLimit = 3;
      switch (newPlan) {
        case 'pro': 
          newDailyLimit = 3500;
          break;
        case 'vip':
          newDailyLimit = 1600;
          break;
        default:
          newDailyLimit = 3;
      }
      
      // تحويل التاريخ إلى سلسلة نصية
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const subscriptionEndDate = thirtyDaysFromNow.toISOString();
      
      // تحديث باقة المستخدم في قاعدة البيانات
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_plan: newPlan,
          daily_image_limit: newDailyLimit,
          subscription_end_date: subscriptionEndDate // تحويل التاريخ إلى سلسلة نصية
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // تحديث حالة واجهة المستخدم
      setSubscriptionInfo(prev => ({
        ...prev,
        plan: newPlan,
        dailyLimit: newDailyLimit
      }));
      
      // تحديث AuthContext
      await refreshUserProfile();
      
      toast({
        title: 'تم بنجاح',
        description: `تم تحديث باقتك إلى ${newPlan === 'pro' ? 'PRO' : newPlan === 'vip' ? 'VIP' : 'العادية'}`,
      });
      
      return true;
    } catch (error) {
      console.error('خطأ في تحديث الباقة:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحديث الباقة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
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
    fetchUserProfile,
    subscriptionInfo,
    updateSubscriptionPlan
  };
};
