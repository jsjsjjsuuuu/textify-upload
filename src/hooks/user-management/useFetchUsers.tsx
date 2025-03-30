
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import React from 'react';

export const useFetchUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // جلب قائمة المستخدمين
  const fetchUsers = async () => {
    if (isLoading) return; // منع التنفيذ المتعدد إذا كان هناك طلب جاري بالفعل
    
    setIsLoading(true);
    setFetchError(null);
    try {
      console.log('بدء جلب بيانات المستخدمين...');
      setFetchAttempted(true); // تعيين أنه تمت محاولة الجلب على الأقل مرة واحدة
      
      // استدعاء وظيفة admin_get_complete_users
      const { data: completeUsersData, error: completeUsersError } = await supabase
        .rpc('admin_get_complete_users');
      
      if (completeUsersError) {
        console.error('خطأ في جلب بيانات المستخدمين الكاملة:', completeUsersError);
        throw completeUsersError;
      }
      
      if (!completeUsersData || completeUsersData.length === 0) {
        console.log('لم يتم العثور على مستخدمين');
        setUsers([]);
        toast.info('لم يتم العثور على مستخدمين');
        setIsLoading(false);
        return;
      }
      
      // تمت العملية بنجاح، تحديث قائمة المستخدمين
      console.log('تم جلب بيانات المستخدمين الكاملة بنجاح، العدد:', completeUsersData.length);
      
      // التحقق من اكتمال البيانات الأساسية لكل مستخدم
      const validatedUsers = completeUsersData.map(user => {
        // تسجيل المستخدمين الذين تنقصهم بيانات أساسية
        if (!user.email) {
          console.warn('مستخدم بدون بريد إلكتروني:', { userId: user.id, userName: user.full_name });
        }
        
        // إضافة قيم افتراضية للحقول المفقودة
        return {
          ...user,
          email: user.email || `user-${user.id.substring(0, 8)}@example.com`,
          full_name: user.full_name || 'مستخدم بدون اسم',
          subscription_plan: user.subscription_plan || 'standard',
          account_status: user.account_status || 'active',
          is_approved: typeof user.is_approved === 'boolean' ? user.is_approved : false
        };
      });
      
      setUsers(validatedUsers);
      
    } catch (error: any) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
      
      // محاولة استخدام طريقة بديلة لجلب البيانات
      try {
        console.log('جاري محاولة استخدام طريقة بديلة لجلب البيانات...');
        
        // جلب بيانات المستخدمين من جدول profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) {
          console.error('خطأ في جلب الملفات الشخصية:', profilesError);
          toast.error('فشل في جلب بيانات المستخدمين');
          setFetchError('فشل في جلب بيانات المستخدمين: ' + (profilesError.message || 'خطأ غير معروف'));
          setIsLoading(false);
          return;
        }
        
        if (!profilesData || profilesData.length === 0) {
          console.log('لم يتم العثور على بيانات للمستخدمين');
          setUsers([]);
          setIsLoading(false);
          return;
        }
        
        // استخدام البيانات المتاحة فقط
        const usersWithDefaultValues = profilesData.map(profile => ({
          ...profile,
          id: profile.id,
          email: profile.username ? `${profile.username}@example.com` : `user-${profile.id.substring(0, 8)}@example.com`,
          created_at: profile.created_at || new Date().toISOString(),
          full_name: profile.full_name || 'مستخدم بدون اسم',
          subscription_plan: profile.subscription_plan || 'standard',
          account_status: profile.account_status || 'active',
          is_approved: typeof profile.is_approved === 'boolean' ? profile.is_approved : false
        }));
        
        setUsers(usersWithDefaultValues);
        
        setFetchError('تعذر جلب البيانات الكاملة للمستخدمين. يتم عرض بيانات محدودة فقط.');
        toast.warning('تم عرض بيانات محدودة للمستخدمين');
      } catch (fallbackError: any) {
        console.error('خطأ في الطريقة البديلة لجلب البيانات:', fallbackError);
        setFetchError(`خطأ غير متوقع: ${error.message || 'خطأ غير معروف'}`);
        toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
        setUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // مكون عرض رسالة الخطأ
  const ErrorAlert = () => {
    if (!fetchError) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>خطأ في جلب البيانات</AlertTitle>
        <AlertDescription>
          {fetchError}
          <div className="mt-2">
            <Button 
              onClick={fetchUsers} 
              variant="link"
              className="p-0 h-auto text-sm"
            >
              إعادة المحاولة
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return {
    users,
    setUsers,
    isLoading,
    fetchAttempted,
    fetchError,
    fetchUsers,
    ErrorAlert
  };
};
