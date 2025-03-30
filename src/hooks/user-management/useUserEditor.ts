
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/UserProfile';

export const useUserEditor = (users: UserProfile[], setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>) => {
  // حالة تحرير المستخدم
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null);
  const [editedUserData, setEditedUserData] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  // وظيفة بدء تحرير بيانات المستخدم
  const startEditing = (userData: UserProfile) => {
    setIsEditingUser(userData.id);
    setEditedUserData({...userData});
    if (userData.subscription_end_date) {
      setSelectedDate(new Date(userData.subscription_end_date));
    } else {
      setSelectedDate(undefined);
    }
  };

  // وظيفة إلغاء التحرير
  const cancelEditing = () => {
    setIsEditingUser(null);
    setEditedUserData(null);
    setSelectedDate(undefined);
  };

  // تحديث بيانات المستخدم أثناء التحرير
  const handleEditChange = (field: string, value: any) => {
    if (editedUserData) {
      setEditedUserData({
        ...editedUserData,
        [field]: value
      });
    }
  };

  // التعامل مع تحديد التاريخ
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (editedUserData) {
      handleEditChange('subscription_end_date', date?.toISOString());
    }
  };

  // وظيفة تحديث بيانات المستخدم بالكامل
  const saveUserData = async () => {
    if (!editedUserData) return;
    
    setIsProcessing(true);
    try {
      console.log('جاري حفظ بيانات المستخدم:', editedUserData.id);
      
      // تحديث بيانات الملف الشخصي
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editedUserData.full_name,
          is_approved: editedUserData.is_approved,
          subscription_plan: editedUserData.subscription_plan,
          account_status: editedUserData.account_status,
          subscription_end_date: editedUserData.subscription_end_date
        })
        .eq('id', editedUserData.id);
      
      if (profileError) {
        console.error('خطأ في تحديث بيانات المستخدم:', profileError);
        toast.error('فشل في تحديث بيانات المستخدم: ' + profileError.message);
        return;
      }
      
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      
      // تحديث المستخدم في حالة المستخدمين المحلية
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editedUserData.id ? { ...user, ...editedUserData } : user
        )
      );
      
      // إعادة تعيين حالة التحرير
      setIsEditingUser(null);
      setEditedUserData(null);
    } catch (error) {
      console.error('خطأ غير متوقع في حفظ بيانات المستخدم:', error);
      toast.error('حدث خطأ أثناء حفظ بيانات المستخدم');
    } finally {
      setIsProcessing(false);
    }
  };

  // وظيفة تغيير البريد الإلكتروني للمستخدم
  const updateUserEmail = async (userId: string, newEmail: string) => {
    setIsProcessing(true);
    try {
      console.log('جاري تغيير البريد الإلكتروني للمستخدم:', userId, newEmail);
      
      // استدعاء وظيفة قاعدة البيانات المخصصة لتغيير البريد الإلكتروني
      const { data, error } = await supabase.rpc('admin_update_user_email', {
        user_id: userId,
        new_email: newEmail
      });
      
      if (error) {
        console.error('خطأ في تغيير البريد الإلكتروني:', error);
        toast.error('فشل في تغيير البريد الإلكتروني: ' + error.message);
        return;
      }
      
      if (data === true) {
        toast.success('تم تغيير البريد الإلكتروني بنجاح');
        
        // تحديث البريد الإلكتروني في قائمة المستخدمين المحلية
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, email: newEmail } : user
          )
        );
        
        // تحديث بيانات المستخدم المعدّل إذا كان مفتوحاً
        if (editedUserData && editedUserData.id === userId) {
          setEditedUserData({
            ...editedUserData,
            email: newEmail
          });
        }
      } else {
        toast.error('لم يتم العثور على المستخدم أو البريد الإلكتروني مستخدم بالفعل');
      }
    } catch (error) {
      console.error('خطأ غير متوقع في تغيير البريد الإلكتروني:', error);
      toast.error('حدث خطأ أثناء تغيير البريد الإلكتروني');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isEditingUser,
    editedUserData,
    selectedDate,
    isProcessing,
    startEditing,
    cancelEditing,
    handleEditChange,
    handleDateSelect,
    saveUserData,
    updateUserEmail
  };
};
