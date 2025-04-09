
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from './types';
import { toast } from 'sonner';

/**
 * خدمة إدارة ملفات تعريف المستخدمين
 */
export class UserProfileService {
  private supabaseClient: SupabaseClient;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * جلب ملف تعريف المستخدم بمعرف معين
   */
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log("جلب ملف المستخدم الشخصي:", userId);
      
      // محاولة جلب الملف الشخصي
      const { data, error } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("خطأ في جلب الملف الشخصي:", error);
        return null;
      }

      if (!data) {
        console.log("لم يتم العثور على ملف شخصي، محاولة إنشاء واحد جديد");
        return await this.createUserProfileIfMissing(userId);
      }
      
      console.log("تم جلب الملف الشخصي بنجاح:", data);
      
      // التأكد من أن is_admin هو Boolean
      const profile = {
        ...data,
        is_admin: data.is_admin === true
      } as UserProfile;
      
      console.log("بيانات الملف الشخصي بعد المعالجة:", {
        ...profile,
        is_admin_original: data.is_admin,
        is_admin_processed: profile.is_admin,
        is_admin_type: typeof profile.is_admin
      });
      
      return profile;
    } catch (error) {
      console.error("خطأ غير متوقع في جلب الملف الشخصي:", error);
      return null;
    }
  }

  /**
   * إنشاء ملف تعريف للمستخدم إذا لم يكن موجوداً
   */
  async createUserProfileIfMissing(userId: string, fullName?: string, plan?: string): Promise<UserProfile | null> {
    console.log("محاولة إنشاء ملف شخصي جديد للمستخدم:", userId);
    
    try {
      // جلب بيانات المستخدم
      const { data: userData } = await this.supabaseClient.auth.getUser();
      const userEmail = userData?.user?.email || '';
      
      // التحقق من عدم وجود الملف الشخصي
      const { data: existingProfile } = await this.supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (existingProfile) {
        console.log("الملف الشخصي موجود بالفعل:", existingProfile.id);
        // جلب الملف الشخصي الكامل وإعادته
        return await this.fetchUserProfile(userId);
      }
      
      // إنشاء ملف شخصي جديد
      const { data: newProfile, error: insertError } = await this.supabaseClient
        .from('profiles')
        .insert([
          { 
            id: userId,
            username: userEmail.split('@')[0],
            full_name: fullName || '',
            subscription_plan: plan || 'standard',
            is_approved: false,
            is_admin: false
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error("فشل في إنشاء ملف شخصي:", insertError);
        return null;
      }
      
      console.log("تم إنشاء ملف شخصي جديد بنجاح:", newProfile);
      return newProfile;
    } catch (error) {
      console.error("خطأ غير متوقع في إنشاء الملف الشخصي:", error);
      return null;
    }
  }
  
  /**
   * عملية تسجيل الدخول
   */
  async signIn(email: string, password: string) {
    console.log("محاولة تسجيل الدخول:", email);
    
    try {
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("خطأ في تسجيل الدخول:", error.message);
        return { error, user: null };
      }
      
      return { error: null, user: data.user };
    } catch (error: any) {
      console.error("خطأ غير متوقع في تسجيل الدخول:", error);
      return { error: { message: error.message }, user: null };
    }
  }

  /**
   * عملية تسجيل الخروج
   */
  async signOut() {
    try {
      await this.supabaseClient.auth.signOut();
      console.log('تم تسجيل الخروج بنجاح');
    } catch (error: any) {
      console.error('خطأ أثناء تسجيل الخروج:', error.message);
      throw error;
    }
  }

  /**
   * عملية إنشاء حساب جديد
   */
  async signUp(email: string, password: string, fullName: string, plan: string) {
    try {
      console.log("بدء عملية تسجيل مستخدم جديد:", email);
      
      const { data, error } = await this.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            subscription_plan: plan
          }
        }
      });

      if (error) {
        console.error("خطأ في التسجيل:", error.message);
        return { error, user: null };
      }

      console.log('تم التسجيل بنجاح، المستخدم:', data.user);
      
      return { error: null, user: data.user };
    } catch (error: any) {
      console.error("خطأ غير متوقع في التسجيل:", error);
      return { error: { message: error.message }, user: null };
    }
  }

  /**
   * طلب استعادة كلمة المرور
   */
  async forgotPassword(email: string) {
    try {
      const { data, error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("خطأ في طلب إعادة تعيين كلمة المرور:", error.message);
        return { error, sent: false };
      }

      console.log('تم إرسال رابط إعادة تعيين كلمة المرور بنجاح');
      return { error: null, sent: true };
    } catch (error: any) {
      console.error("خطأ غير متوقع في طلب إعادة تعيين كلمة المرور:", error);
      return { error: { message: error.message }, sent: false };
    }
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  async resetPassword(newPassword: string) {
    try {
      const { data, error } = await this.supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("خطأ في إعادة تعيين كلمة المرور:", error.message);
        return { error, success: false };
      }

      console.log('تم تحديث كلمة المرور بنجاح');
      return { error: null, success: true };
    } catch (error: any) {
      console.error("خطأ غير متوقع في إعادة تعيين كلمة المرور:", error);
      return { error: { message: error.message }, success: false };
    }
  }

  /**
   * تحديث بيانات المستخدم
   */
  async updateUser(updates: any) {
    try {
      const { data, error } = await this.supabaseClient.auth.updateUser(updates);

      if (error) {
        console.error("خطأ في تحديث معلومات المستخدم:", error.message);
        return { data: null, error };
      }

      console.log('تم تحديث معلومات المستخدم بنجاح');
      return { data, error: null };
    } catch (error: any) {
      console.error("خطأ غير متوقع في تحديث معلومات المستخدم:", error);
      return { data: null, error: { message: error.message } };
    }
  }
}
