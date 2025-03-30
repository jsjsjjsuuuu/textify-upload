
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

  // جلب قائمة المستخدمين - مع تحسينات إضافية للتعامل مع البريد الإلكتروني
  const fetchUsers = async () => {
    if (isLoading) return; // منع التنفيذ المتعدد إذا كان هناك طلب جاري بالفعل
    
    setIsLoading(true);
    setFetchError(null);
    try {
      console.log('بدء جلب بيانات المستخدمين... - نسخة محسنة');
      setFetchAttempted(true); // تعيين أنه تمت محاولة الجلب على الأقل مرة واحدة
      
      // استدعاء وظيفة admin_get_complete_users المحسنة
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
          email_length: completeUsersData[0].email ? completeUsersData[0].email.length : 0,
          is_admin: completeUsersData[0].is_admin,
          is_admin_type: typeof completeUsersData[0].is_admin
        });
      }
      
      // التأكد من ظهور البريد الإلكتروني بشكل صحيح دائمًا
      const validatedUsers = completeUsersData.map(user => {
        // تسجيل المستخدمين الذين تنقصهم بيانات أساسية
        if (!user.id) {
          console.error('مستخدم بدون معرف!', user);
        }
        
        // إذا كان البريد الإلكتروني فارغًا، نحاول استردادة من مكان آخر
        let userEmail = user.email || '';
        
        // تحقق إضافي من طول البريد الإلكتروني
        if (userEmail.length < 3 || !userEmail.includes('@')) {
          console.warn(`تم العثور على بريد إلكتروني غير صالح للمستخدم ${user.id}: "${userEmail}"`);
          userEmail = ''; // إعادة تعيين البريد إذا كان غير صالح
        }
        
        return {
          ...user,
          id: user.id || crypto.randomUUID(), // نادر جدًا، لكن للأمان
          email: userEmail,
          full_name: user.full_name || 'مستخدم بدون اسم',
          subscription_plan: user.subscription_plan || 'standard',
          account_status: user.account_status || 'active',
          is_approved: typeof user.is_approved === 'boolean' ? user.is_approved : false,
          is_admin: typeof user.is_admin === 'boolean' ? user.is_admin : false
        };
      });
      
      setUsers(validatedUsers);
      console.log('تم تحديث قائمة المستخدمين بنجاح، العدد الإجمالي:', validatedUsers.length);
      
    } catch (error: any) {
      console.error('خطأ في جلب بيانات المستخدمين:', error);
      
      // محاولة استخدام طريقة بديلة محسّنة لجلب البيانات
      try {
        console.log('جاري محاولة استخدام طريقة بديلة لجلب البيانات - استدعاء admin_get_basic_users...');
        
        // استدعاء وظيفة admin_get_basic_users المحسنة
        const { data: basicUsersData, error: basicUsersError } = await supabase
          .rpc('admin_get_basic_users');
        
        if (basicUsersError) {
          console.error('خطأ في استدعاء وظيفة admin_get_basic_users:', basicUsersError);
          throw basicUsersError;
        }
        
        if (!basicUsersData || basicUsersData.length === 0) {
          console.log('لم يتم العثور على بيانات للمستخدمين من الوظيفة البديلة');
          throw new Error('لم يتم العثور على بيانات للمستخدمين');
        }
        
        console.log('تم جلب بيانات أساسية من وظيفة admin_get_basic_users، العدد:', basicUsersData.length);
        
        // تسجيل عينة من البيانات المستلمة
        if (basicUsersData.length > 0) {
          console.log('عينة من البيانات الأساسية (أول مستخدم):', {
            id: basicUsersData[0].id,
            email: basicUsersData[0].email,
            email_length: basicUsersData[0].email ? basicUsersData[0].email.length : 0
          });
        }
        
        // جلب بيانات الملفات الشخصية للتكامل
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*');
        
        // إنشاء خريطة للملفات الشخصية
        const profilesMap = new Map();
        if (profilesData && profilesData.length > 0) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
        
        // دمج بيانات المستخدمين مع الملفات الشخصية مع التعامل المحسن مع البريد الإلكتروني
        const mergedUsers = basicUsersData.map(user => {
          const profile = profilesMap.get(user.id) || {};
          
          // التأكد من صحة البريد الإلكتروني واستخدامه فقط إذا كان صالحًا
          let userEmail = user.email || '';
          
          // تحقق إضافي من طول البريد الإلكتروني
          if (userEmail.length < 3 || !userEmail.includes('@')) {
            console.warn(`تم العثور على بريد إلكتروني غير صالح للمستخدم ${user.id}: "${userEmail}"`);
            userEmail = ''; // إعادة تعيين البريد إذا كان غير صالح
          }
            
          // استخراج البيانات بشكل آمن من raw_user_meta_data
          const raw_meta = user.raw_user_meta_data || {};
          const fullNameFromMeta = typeof raw_meta === 'object' && raw_meta !== null 
            ? (raw_meta as Record<string, any>).full_name 
            : undefined;
            
          const phoneFromMeta = typeof raw_meta === 'object' && raw_meta !== null 
            ? (raw_meta as Record<string, any>).phone 
            : '';
            
          const addressFromMeta = typeof raw_meta === 'object' && raw_meta !== null 
            ? (raw_meta as Record<string, any>).address 
            : '';
            
          const notesFromMeta = typeof raw_meta === 'object' && raw_meta !== null 
            ? (raw_meta as Record<string, any>).notes 
            : '';
          
          return {
            id: user.id,
            email: userEmail,
            created_at: user.created_at,
            updated_at: user.updated_at || profile.updated_at,
            full_name: profile.full_name || fullNameFromMeta || 'مستخدم بدون اسم',
            avatar_url: profile.avatar_url || '',
            is_approved: typeof profile.is_approved === 'boolean' ? profile.is_approved : false,
            is_admin: typeof profile.is_admin === 'boolean' ? profile.is_admin : false,
            subscription_plan: profile.subscription_plan || 'standard',
            account_status: profile.account_status || 'active',
            subscription_end_date: profile.subscription_end_date,
            username: profile.username || '',
            last_login_at: user.last_sign_in_at,
            phone_number: phoneFromMeta,
            address: addressFromMeta,
            notes: notesFromMeta,
          };
        });
        
        setUsers(mergedUsers);
        console.log('تم تحديث قائمة المستخدمين باستخدام الطريقة البديلة المحسنة، العدد:', mergedUsers.length);
        
        setFetchError('تم عرض بيانات المستخدمين بنجاح ولكن قد تكون بعض البيانات غير مكتملة.');
        toast.success('تم جلب بيانات المستخدمين بنجاح');
        
      } catch (fallbackError: any) {
        console.error('خطأ في الطريقة البديلة لجلب البيانات:', fallbackError);
        
        // محاولة آخر طريقة إذا فشلت الطرق الأخرى
        try {
          console.log('محاولة استرجاع البريد الإلكتروني باستخدام وظيفة get_users_emails...');
          
          // محاولة إضافية لاسترجاع عناوين البريد الإلكتروني للمستخدمين
          const { data: emailsData } = await supabase.rpc('get_users_emails');
          
          // إنشاء خريطة للبريد الإلكتروني إذا كانت البيانات متوفرة
          let emailsMap = new Map();
          if (emailsData && emailsData.length > 0) {
            emailsData.forEach(item => {
              if (item.id && item.email) { // تأكد من وجود معرف وبريد إلكتروني صالح
                emailsMap.set(item.id, item.email);
              }
            });
            console.log('تم جلب عناوين البريد الإلكتروني للمستخدمين:', emailsMap.size);
          } else {
            console.warn('لم يتم العثور على بيانات البريد الإلكتروني من وظيفة get_users_emails');
          }
          
          // استرجاع الملفات الشخصية للمستخدمين
          console.log('محاولة استرجاع بيانات المستخدمين المحدودة من جدول profiles...');
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
          
          if (profilesError) {
            console.error('خطأ في جلب بيانات الملفات الشخصية:', profilesError);
            throw profilesError;
          }
          
          if (profilesData && profilesData.length > 0) {
            // إنشاء قائمة المستخدمين من الملفات الشخصية مع محاولة إضافة البريد الإلكتروني
            const limitedUsers = profilesData.map(profile => {
              // استخدام البريد الإلكتروني من الخريطة إن وجد
              const userEmail = emailsMap.get(profile.id) || '';
              
              return {
                id: profile.id,
                email: userEmail,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                full_name: profile.full_name || 'مستخدم بدون اسم',
                avatar_url: profile.avatar_url || '',
                is_approved: typeof profile.is_approved === 'boolean' ? profile.is_approved : false,
                is_admin: typeof profile.is_admin === 'boolean' ? profile.is_admin : false,
                subscription_plan: profile.subscription_plan || 'standard',
                account_status: profile.account_status || 'active',
                subscription_end_date: profile.subscription_end_date,
                username: profile.username || '',
                last_login_at: null,
                phone_number: '',
                address: '',
                notes: ''
              };
            });
            
            setUsers(limitedUsers);
            console.log('تم تحديث قائمة المستخدمين باستخدام بيانات محدودة، العدد:', limitedUsers.length);
            
            setFetchError('تم عرض بيانات محدودة للمستخدمين. معظم البيانات غير مكتملة.');
            toast.warning('تم عرض بيانات محدودة للمستخدمين');
            setIsLoading(false);
            return;
          }
        } catch (lastError) {
          console.error('فشلت جميع محاولات استرجاع البيانات:', lastError);
        }
        
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
