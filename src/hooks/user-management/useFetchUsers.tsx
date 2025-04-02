
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import React from 'react';

export const useFetchUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [detailedUsers, setDetailedUsers] = useState<{[key: string]: UserProfile}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<{[key: string]: boolean}>({});
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // جلب قائمة المستخدمين الأساسية
  const fetchUsers = async () => {
    if (isLoading) return; // منع التنفيذ المتعدد إذا كان هناك طلب جاري بالفعل
    
    setIsLoading(true);
    setFetchError(null);
    try {
      console.log('بدء جلب قائمة المستخدمين الأساسية...');
      setFetchAttempted(true);
      
      // استدعاء وظيفة admin_get_basic_users_list المُحدّثة
      const startTime = performance.now();
      const { data: basicUsersList, error: basicUsersError } = await supabase
        .rpc('admin_get_basic_users_list');
      const endTime = performance.now();
      
      // تسجيل نتائج الاستدعاء
      console.log('نتائج استدعاء admin_get_basic_users_list:', {
        timeMs: Math.round(endTime - startTime),
        dataReceived: Boolean(basicUsersList),
        dataLength: basicUsersList ? basicUsersList.length : 0,
        hasError: Boolean(basicUsersError),
        errorMessage: basicUsersError ? basicUsersError.message : null
      });
      
      if (basicUsersError) {
        console.error('خطأ في جلب قائمة المستخدمين الأساسية:', basicUsersError);
        throw new Error(`فشل في جلب بيانات المستخدمين: ${basicUsersError.message}`);
      }
      
      if (!basicUsersList) {
        console.log('لم يتم استلام أي بيانات من وظيفة admin_get_basic_users_list');
        throw new Error('لم يتم استلام أي بيانات من قاعدة البيانات');
      }
      
      if (basicUsersList.length === 0) {
        console.log('لم يتم العثور على مستخدمين');
        setUsers([]);
        toast.info('لم يتم العثور على مستخدمين');
        setIsLoading(false);
        return;
      }
      
      console.log('تم جلب قائمة المستخدمين الأساسية بنجاح، العدد:', basicUsersList.length);
      
      // تحويل قائمة المستخدمين الأساسية إلى نموذج UserProfile
      const mappedUsers: UserProfile[] = basicUsersList.map(user => ({
        id: user.id,
        email: user.email || '',
        full_name: user.full_name || 'مستخدم بدون اسم',
        is_approved: typeof user.is_approved === 'boolean' ? user.is_approved : false,
        account_status: user.account_status || 'active',
        subscription_plan: user.subscription_plan || 'standard',
        created_at: user.created_at,
        // سنترك الحقول الأخرى فارغة حتى يتم طلبها
      }));
      
      setUsers(mappedUsers);
      console.log('تم تحديث قائمة المستخدمين بنجاح، العدد الإجمالي:', mappedUsers.length);
      
    } catch (error: any) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
      setFetchError(`خطأ غير متوقع: ${error.message || 'خطأ غير معروف'}`);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
      setUsers([]);
    } finally {
      setIsLoading(false);
      console.log('انتهت عملية جلب البيانات');
    }
  };

  // جلب البيانات التفصيلية لمستخدم محدد
  const fetchUserDetails = useCallback(async (userId: string) => {
    if (isLoadingDetails[userId]) return detailedUsers[userId]; // منع التنفيذ المتعدد
    
    // تحديث حالة التحميل لهذا المستخدم
    setIsLoadingDetails(prev => ({ ...prev, [userId]: true }));
    
    try {
      console.log(`جلب البيانات التفصيلية للمستخدم: ${userId}`);
      
      // استدعاء وظيفة admin_get_user_by_id المُحدّثة
      const { data, error } = await supabase
        .rpc('admin_get_user_by_id', { user_id: userId });
      
      if (error) {
        console.error(`خطأ في جلب البيانات التفصيلية للمستخدم ${userId}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`لم يتم العثور على بيانات للمستخدم: ${userId}`);
        return null;
      }
      
      // الحصول على أول عنصر (يجب أن يكون هناك عنصر واحد فقط)
      const userDetails = data[0];
      console.log(`تم جلب البيانات التفصيلية للمستخدم ${userId} بنجاح`);
      
      // تحديث قائمة المستخدمين المفصلة
      setDetailedUsers(prev => ({ 
        ...prev, 
        [userId]: userDetails 
      }));
      
      return userDetails;
    } catch (error) {
      console.error(`فشل في جلب البيانات التفصيلية للمستخدم ${userId}:`, error);
      return null;
    } finally {
      setIsLoadingDetails(prev => ({ ...prev, [userId]: false }));
    }
  }, [detailedUsers, isLoadingDetails]);

  // مكون عرض رسالة الخطأ المحسن
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
    detailedUsers,
    setUsers,
    isLoading,
    isLoadingDetails,
    fetchAttempted,
    fetchError,
    fetchUsers,
    fetchUserDetails,
    ErrorAlert
  };
};
