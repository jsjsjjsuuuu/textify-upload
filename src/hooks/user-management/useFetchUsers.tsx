
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
      console.log('بدء جلب بيانات المستخدمين باستخدام الوظيفة الجديدة...');
      setFetchAttempted(true); // تعيين أنه تمت محاولة الجلب على الأقل مرة واحدة
      
      // استدعاء الوظيفة الجديدة التي تجمع بيانات المستخدمين بالكامل
      const { data: completeUsersData, error: completeUsersError } = await supabase
        .rpc('admin_get_complete_users');
      
      if (completeUsersError) {
        console.error('خطأ في جلب بيانات المستخدمين الكاملة:', completeUsersError);
        
        // إذا فشل طلب المسؤول، نحاول جلب بيانات الملفات الشخصية العادية كخطة بديلة
        console.log('جاري محاولة استخدام طريقة بديلة لجلب البيانات...');
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) {
          console.error('خطأ في جلب الملفات الشخصية:', profilesError);
          toast.error('فشل في جلب بيانات المستخدمين');
          setFetchError('فشل في جلب بيانات المستخدمين: ' + (completeUsersError.message || 'خطأ غير معروف'));
          setIsLoading(false);
          return;
        }
        
        if (!profilesData || profilesData.length === 0) {
          console.log('لم يتم العثور على بيانات للمستخدمين');
          setUsers([]);
          setIsLoading(false);
          return;
        }
        
        // استخدام بيانات الملفات الشخصية المحدودة المتاحة
        setUsers(profilesData.map(profile => ({
          ...profile,
          id: profile.id,
          email: profile.username ? `${profile.username}@example.com` : `user-${profile.id.substring(0, 8)}@example.com`,
          created_at: profile.created_at || new Date().toISOString()
        })));
        
        setFetchError('تعذر جلب البيانات الكاملة للمستخدمين. يتم عرض بيانات محدودة فقط.');
        toast.warning('تم عرض بيانات محدودة للمستخدمين');
      } else {
        // تم جلب البيانات الكاملة بنجاح
        console.log('تم جلب بيانات المستخدمين الكاملة بنجاح، العدد:', completeUsersData.length);
        setUsers(completeUsersData);
        
        if (completeUsersData.length === 0) {
          console.log('لم يتم العثور على مستخدمين');
          toast.info('لم يتم العثور على مستخدمين');
        }
      }
    } catch (error: any) {
      console.error('خطأ غير متوقع في جلب بيانات المستخدمين:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
      setFetchError(`خطأ غير متوقع: ${error.message || 'خطأ غير معروف'}`);
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
