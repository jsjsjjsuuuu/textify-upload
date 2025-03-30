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
      
      // جلب بيانات الملفات الشخصية أولاً - هذه البيانات متاحة للجميع
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error('خطأ في جلب الملفات الشخصية:', profilesError);
        toast.error('خطأ في جلب بيانات الملفات الشخصية');
        setIsLoading(false);
        setFetchError('فشل في جلب بيانات الملفات الشخصية: ' + profilesError.message);
        return;
      }
      
      if (!profilesData || profilesData.length === 0) {
        console.log('لم يتم العثور على ملفات شخصية');
        setUsers([]);
        setIsLoading(false);
        return;
      }

      console.log('تم جلب الملفات الشخصية بنجاح، العدد:', profilesData.length);
      
      // محاولة جلب بيانات المستخدمين - استخدام محاولات متعددة مع آلية احتياطية
      let authUsersData = null;
      let authUsersError = null;
      
      try {
        // الطريقة 1: استخدام وظيفة RPC المخصصة
        console.log('محاولة 1: استدعاء وظيفة get_users_emails...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_emails');
        
        if (rpcError) {
          console.warn('خطأ في استدعاء get_users_emails:', rpcError);
          throw rpcError; // نقل إلى المحاولة التالية
        }
        
        if (rpcData && Array.isArray(rpcData)) {
          console.log('تم جلب البيانات بنجاح من get_users_emails، العدد:', rpcData.length);
          authUsersData = rpcData;
        } else {
          throw new Error('بيانات غير صالحة من get_users_emails');
        }
      } catch (firstMethodError) {
        console.warn('فشلت المحاولة الأولى، جاري تجربة طريقة بديلة...');
        
        try {
          // الطريقة 2: استخدام استعلام مباشر إلى جدول auth.users إذا كان لديك امتيازات الإدارة
          console.log('محاولة 2: استخدام طريقة بديلة للحصول على بيانات المستخدمين...');
          
          // هذا الاستعلام سيعمل فقط للمستخدمين المشرفين
          const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('id, is_admin')
            .eq('id', (await supabase.auth.getUser()).data.user?.id);
          
          const isAdmin = adminData && adminData.length > 0 && adminData[0].is_admin;
          
          if (isAdmin) {
            // محاولة استدعاء دالة أخرى مخصصة للمشرفين
            const { data: adminUsersData, error: adminUsersError } = await supabase
              .rpc('admin_get_users_with_email');
            
            if (!adminUsersError && adminUsersData) {
              authUsersData = adminUsersData;
              console.log('تم جلب البيانات بنجاح باستخدام امتيازات المشرف');
            } else {
              authUsersError = adminUsersError;
              console.warn('فشل استدعاء admin_get_users_with_email:', adminUsersError);
            }
          } else {
            console.warn('المستخدم ليس مشرفًا، لا يمكن استخدام طريقة المشرف');
          }
        } catch (secondMethodError) {
          console.warn('فشلت المحاولة الثانية، سيتم استخدام البيانات المتاحة فقط');
          authUsersError = secondMethodError;
        }
      }
      
      // استخدام البيانات المتاحة حتى لو فشلت بعض المحاولات
      console.log('إنشاء قائمة المستخدمين باستخدام البيانات المتاحة...');
      
      // إنشاء كائن للبحث السريع عن البريد الإلكتروني وتاريخ الإنشاء حسب معرف المستخدم
      const authUsersMap: Record<string, { email: string, created_at: string }> = {};
      
      if (authUsersData && Array.isArray(authUsersData)) {
        authUsersData.forEach((user: { id: string, email: string, created_at: string }) => {
          if (user && user.id) {
            authUsersMap[user.id] = { 
              email: user.email || '',
              created_at: user.created_at || new Date().toISOString()
            };
          }
        });
        console.log('تم إنشاء خريطة بيانات المستخدمين، عدد العناصر:', Object.keys(authUsersMap).length);
      } else {
        console.warn('لم تتوفر بيانات المستخدمين الكاملة، سيتم استخدام البيانات المتاحة فقط.');
        if (authUsersError) {
          console.error('خطأ في جلب بيانات المستخدمين:', authUsersError);
          // لا نقوم بإظهار رسالة خطأ للمستخدم هنا لأننا سنستخدم البيانات المتاحة
        }
      }
      
      // تحويل بيانات الملفات الشخصية إلى قائمة المستخدمين
      const usersWithCompleteData = (profilesData || []).map((profile: any) => {
        // استخدام بيانات المستخدم من الخريطة إذا كانت متاحة، أو توليد بيانات افتراضية
        const userData = authUsersMap[profile.id] || { 
          email: profile.username ? `${profile.username}@example.com` : `user-${profile.id.substring(0, 8)}@example.com`, 
          created_at: profile.created_at || new Date().toISOString() 
        };
        
        // معالجة is_admin بشكل أكثر دقة
        const isAdmin = profile.is_admin === true;
        
        return {
          ...profile,
          id: profile.id,
          email: userData.email,
          is_admin: isAdmin,
          created_at: userData.created_at || profile.created_at,
        };
      });
      
      console.log('معلومات المستخدمين بعد المعالجة:', usersWithCompleteData.length);
      setUsers(usersWithCompleteData);
      
      // إذا كانت هناك مشكلة جزئية في جلب البيانات ولكن تمكنا من الحصول على بعض البيانات
      if (authUsersError && usersWithCompleteData.length > 0) {
        setFetchError('تمكنا من جلب البيانات الأساسية ولكن بعض المعلومات قد تكون غير مكتملة. قد ترى عناوين بريد إلكتروني افتراضية.');
        toast.warning('بعض بيانات المستخدمين قد تكون غير مكتملة، ولكن الوظائف الأساسية تعمل');
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
