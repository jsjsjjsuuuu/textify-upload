
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

  // جلب قائمة المستخدمين - مع تحسينات كبيرة في معالجة الأخطاء
  const fetchUsers = async () => {
    if (isLoading) return; // منع التنفيذ المتعدد إذا كان هناك طلب جاري بالفعل
    
    setIsLoading(true);
    setFetchError(null);
    try {
      console.log('بدء جلب بيانات المستخدمين... - نسخة محسنة');
      setFetchAttempted(true); // تعيين أنه تمت محاولة الجلب على الأقل مرة واحدة
      
      // استدعاء وظيفة admin_get_complete_users بشكل ذكي مع معالجة أكثر دقة للأخطاء
      console.log('استدعاء وظيفة admin_get_complete_users...');
      const startTime = performance.now();
      const { data: completeUsersData, error: completeUsersError } = await supabase
        .rpc('admin_get_complete_users');
      const endTime = performance.now();
      
      // تسجيل نتائج الاستدعاء بشكل أكثر تفصيلاً
      console.log('نتائج استدعاء admin_get_complete_users:', {
        timeMs: Math.round(endTime - startTime),
        dataReceived: Boolean(completeUsersData),
        dataLength: completeUsersData ? completeUsersData.length : 0,
        hasError: Boolean(completeUsersError),
        errorMessage: completeUsersError ? completeUsersError.message : null,
        errorDetails: completeUsersError ? completeUsersError : null
      });
      
      if (completeUsersError) {
        console.error('خطأ في جلب بيانات المستخدمين الكاملة:', completeUsersError);
        throw new Error(`فشل في جلب بيانات المستخدمين: ${completeUsersError.message}`);
      }
      
      if (!completeUsersData) {
        console.log('لم يتم استلام أي بيانات من وظيفة admin_get_complete_users');
        throw new Error('لم يتم استلام أي بيانات من قاعدة البيانات');
      }
      
      if (completeUsersData.length === 0) {
        console.log('لم يتم العثور على مستخدمين');
        setUsers([]);
        toast.info('لم يتم العثور على مستخدمين');
        setIsLoading(false);
        return;
      }
      
      // تمت العملية بنجاح، تحديث قائمة المستخدمين
      console.log('تم جلب بيانات المستخدمين الكاملة بنجاح، العدد:', completeUsersData.length);
      
      // سجل بيانات المستخدم الأول للتصحيح
      if (completeUsersData.length > 0) {
        console.log('نموذج بيانات المستخدم (أول مستخدم):', {
          id: completeUsersData[0].id,
          email: completeUsersData[0].email,
          is_admin: completeUsersData[0].is_admin,
          is_admin_type: typeof completeUsersData[0].is_admin
        });
      }
      
      // التحقق من اكتمال البيانات الأساسية لكل مستخدم
      const validatedUsers = completeUsersData.map(user => {
        // تسجيل المستخدمين الذين تنقصهم بيانات أساسية
        if (!user.id) {
          console.error('مستخدم بدون معرف!', user);
        }
        
        if (!user.email) {
          console.warn('مستخدم بدون بريد إلكتروني:', { 
            userId: user.id, 
            userName: user.full_name 
          });
        }
        
        // إضافة قيم افتراضية للحقول المفقودة
        return {
          ...user,
          id: user.id || crypto.randomUUID(), // نادر جدًا، لكن للأمان
          email: user.email || `user-${user.id?.substring(0, 8) || 'unknown'}@example.com`,
          full_name: user.full_name || 'مستخدم بدون اسم',
          subscription_plan: user.subscription_plan || 'standard',
          account_status: user.account_status || 'active',
          is_approved: typeof user.is_approved === 'boolean' ? user.is_approved : false,
          is_admin: typeof user.is_admin === 'boolean' ? user.is_admin : false // تأكد من أن is_admin قيمة منطقية
        };
      });
      
      setUsers(validatedUsers);
      console.log('تم تحديث قائمة المستخدمين بنجاح، العدد الإجمالي:', validatedUsers.length);
      
    } catch (error: any) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
      
      // محاولة استخدام طريقة بديلة محسّنة لجلب البيانات
      try {
        console.log('جاري محاولة استخدام طريقة بديلة لجلب البيانات...');
        
        // 1. جلب بيانات المستخدمين من جدول profiles
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
        
        // 2. محاولة جلب بيانات إضافية من auth.users إذا أمكن
        console.log('محاولة استرجاع بيانات المستخدمين الإضافية...');
        let authUsers = [];
        try {
          // هذا قد لا ينجح لأن RLS قد يمنع الوصول، لكن نحاول على أي حال
          const { data: authUsersData } = await supabase.auth.admin.listUsers();
          authUsers = authUsersData?.users || [];
          console.log('تم استرجاع بيانات المستخدمين من auth.admin.listUsers:', authUsers.length);
        } catch (authError) {
          console.warn('لم نتمكن من استرداد قائمة المستخدمين من auth.admin:', authError);
          // استمر مع البيانات المحدودة المتاحة
        }
        
        console.log('تم جلب بيانات محدودة من جدول profiles، العدد:', profilesData.length);
        
        // استخدام البيانات المتاحة لتكوين قائمة المستخدمين
        const usersWithDefaultValues = profilesData.map(profile => {
          // محاولة العثور على معلومات المستخدم المطابقة من auth.users
          const authUser = authUsers.find(u => u.id === profile.id);
          
          return {
            ...profile,
            id: profile.id,
            email: authUser?.email || (profile.username ? `${profile.username}@example.com` : `user-${profile.id.substring(0, 8)}@example.com`),
            created_at: authUser?.created_at || profile.created_at || new Date().toISOString(),
            full_name: profile.full_name || 'مستخدم بدون اسم',
            subscription_plan: profile.subscription_plan || 'standard',
            account_status: profile.account_status || 'active',
            is_approved: typeof profile.is_approved === 'boolean' ? profile.is_approved : false,
            is_admin: typeof profile.is_admin === 'boolean' ? profile.is_admin : false // تأكد من أن is_admin قيمة منطقية
          };
        });
        
        setUsers(usersWithDefaultValues);
        console.log('تم تحديث قائمة المستخدمين باستخدام البيانات المتاحة، العدد:', usersWithDefaultValues.length);
        
        setFetchError('تم عرض بيانات محدودة للمستخدمين. قد تكون بعض البيانات غير كاملة.');
        toast.warning('تم عرض بيانات محدودة للمستخدمين');
      } catch (fallbackError: any) {
        console.error('خطأ في الطريقة البديلة لجلب البيانات:', fallbackError);
        setFetchError(`خطأ غير متوقع: ${error.message || 'خطأ غير معروف'}`);
        toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
        setUsers([]);
      }
    } finally {
      setIsLoading(false);
      console.log('انتهت عملية جلب البيانات');
    }
  };

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
    setUsers,
    isLoading,
    fetchAttempted,
    fetchError,
    fetchUsers,
    ErrorAlert
  };
};
