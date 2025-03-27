import React, { createContext, useState, useEffect, useContext } from 'react';
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// واجهة UserProfile موحدة مع استخدام أسماء الحقول الجديدة فقط
interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_approved: boolean | null;
  is_admin: boolean | null;
  subscription_plan?: string | null;
  subscription_end_date?: string | null;
  account_status?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  supabaseClient: SupabaseClient | null;
  auth: any | null;
  user: any | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; user: any | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, plan: string) => Promise<{ error: any; user: any | null }>;
  forgotPassword: (email: string) => Promise<{ error: any; sent: boolean }>;
  resetPassword: (newPassword: string) => Promise<{ error: any; success: boolean }>;
  updateUser: (updates: any) => Promise<{ data: any; error: any }>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [auth, setAuth] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setSupabaseClient(supabase);
        setAuth(supabase.auth);

        // تهيئة Supabase مع الإعدادات الصحيحة للتعامل مع الجلسة
        console.log("تهيئة خدمة المصادقة...");

        // الاشتراك في أحداث تغيير حالة المصادقة
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log("تغيرت حالة المصادقة:", event);
          
          // تحديث حالة الجلسة والمستخدم
          setSession(currentSession);
          setUser(currentSession?.user || null);

          // إذا كان المستخدم مسجل دخوله، نجلب ملفه الشخصي
          if (currentSession?.user) {
            await fetchUserProfileSafely(currentSession.user.id);
          } else {
            setUserProfile(null);
          }
        });

        // الحصول على الجلسة الحالية
        const { data: initialSession } = await supabase.auth.getSession();
        setSession(initialSession.session);

        // جلب بيانات المستخدم إذا كانت الجلسة موجودة
        if (initialSession.session?.user) {
          console.log("تم العثور على جلسة موجودة، جاري تحميل بيانات المستخدم:", initialSession.session.user.id);
          setUser(initialSession.session.user);
          
          await fetchUserProfileSafely(initialSession.session.user.id);
        } else {
          console.log("لم يتم العثور على جلسة موجودة");
        }

        // إعادة التصريح عند إغلاق المكون
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("خطأ في تهيئة المصادقة:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // طريقة آمنة لجلب الملف الشخصي بدون تكرار لانهائي
  const fetchUserProfileSafely = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log("جلب ملف المستخدم الشخصي بطريقة آمنة:", userId);
      
      // استخدام RPC بدلاً من الاستعلام المباشر لتجنب مشكلة التكرار اللانهائي
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("خطأ في جلب الملف الشخصي:", error);
        return null;
      }

      if (!data) {
        // إذا لم يتم العثور على ملف شخصي، قم بإنشاء واحد جديد
        console.log("لم يتم العثور على ملف شخصي، محاولة إنشاء واحد جديد");
        return await createUserProfileIfMissing(userId);
      }
      
      console.log("تم جلب الملف الشخصي بنجاح:", data);
      
      // التأكد من أن is_admin هو Boolean
      const profile = {
        ...data,
        is_admin: data.is_admin === true
      } as UserProfile;
      
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error("خطأ غير متوقع في جلب الملف الشخصي:", error);
      return null;
    }
  };

  // وظيفة إنشاء ملف تعريف المستخدم إذا لم يكن موجودًا
  const createUserProfileIfMissing = async (userId: string, fullName?: string, plan?: string): Promise<UserProfile | null> => {
    console.log("محاولة إنشاء ملف شخصي جديد للمستخدم:", userId);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || '';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId,
            username: userEmail.split('@')[0],
            full_name: fullName || '',
            subscription_plan: plan || 'standard',
            is_approved: false, // يحتاج للموافقة من قبل المسؤول
            is_admin: false // تعيين is_admin كـ false افتراضيًا
          }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error("فشل في إنشاء ملف شخصي:", insertError);
        return null;
      }
      
      console.log("تم إنشاء ملف شخصي جديد بنجاح:", newProfile);
      setUserProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error("خطأ غير متوقع في إنشاء الملف الشخصي:", error);
      return null;
    }
  };

  // إعادة تحميل الملف الشخصي
  const refreshUserProfile = async (): Promise<void> => {
    if (!user) return;
    
    console.log("إعادة تحميل الملف الشخصي للمستخدم:", user.id);
    await fetchUserProfileSafely(user.id);
  };

  // تحديث وظيفة fetchUserProfile
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    return await fetchUserProfileSafely(userId);
  };

  const signIn = async (email: string, password: string) => {
    console.log("محاولة تسجيل الدخول:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("خطأ في تسجيل الدخول:", error.message);
        return { error, user: null };
      }
      
      if (data.user) {
        console.log("تم تسجيل الدخول بنجاح، جلب الملف الشخصي");
        await fetchUserProfileSafely(data.user.id);
      }
      
      return { error: null, user: data.user };
    } catch (error: any) {
      console.error("خطأ غير متوقع في تسجيل الدخول:", error);
      return { error: { message: error.message }, user: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      console.log('تم تسجيل الخروج بنجاح');
    } catch (error: any) {
      console.error('خطأ أثناء تسجيل الخروج:', error.message);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, plan: string) => {
    try {
      console.log("بدء عملية تسجيل مستخدم جديد:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // إضافة البيانات الوصفية للمستخدم
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
      
      // إنشاء ملف شخصي للمستخدم عند التسجيل
      if (data.user) {
        await createUserProfileIfMissing(data.user.id, fullName, plan);
      }

      return { error: null, user: data.user };
    } catch (error: any) {
      console.error("خطأ غير متوقع في التسجيل:", error);
      return { error: { message: error.message }, user: null };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
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
  };

  const resetPassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
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
  };

  const updateUser = async (updates: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser(updates);

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
  };

  const value: AuthContextType = {
    supabaseClient,
    auth,
    user,
    session,
    userProfile,
    isLoading,
    signIn,
    signOut,
    signUp,
    forgotPassword,
    resetPassword,
    updateUser,
    fetchUserProfile,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
