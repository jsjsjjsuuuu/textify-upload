import React, { createContext, useState, useEffect, useContext } from 'react';
import { Auth, SupabaseClient, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  isApproved: boolean;
  // Add other profile fields here
}

interface AuthContextType {
  supabaseClient: SupabaseClient | null;
  auth: Auth | null;
  user: any | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; user: any | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: any; user: any | null }>;
  forgotPassword: (email: string) => Promise<{ error: any; sent: boolean }>;
  resetPassword: (newPassword: string) => Promise<{ error: any; success: boolean }>;
  updateUser: (updates: any) => Promise<{ data: any; error: any }>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      setSupabaseClient(supabase);
      setAuth(supabase.auth);

      // Fetch initial session
      const { data: initialSession } = await supabase.auth.getSession();
      setSession(initialSession.session);

      // Fetch user data if session exists
      if (initialSession.session?.user) {
        setUser(initialSession.session.user);
        await fetchUserProfile(initialSession.session.user.id);
      }

      setIsLoading(false);

      // Subscribe to auth state changes
      supabase.auth.onAuthStateChange(async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        } else {
          setUserProfile(null);
        }
      });
    };

    initializeAuth();
  }, []);

  // أضف هذه الوظيفة داخل مزود السياق AuthProvider
  const createUserProfileIfMissing = async (userId: string) => {
    console.log("التحقق من وجود ملف شخصي للمستخدم:", userId);
    
    try {
      // التحقق مما إذا كان الملف الشخصي موجود
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // خطأ غير متوقع
        console.error("خطأ في التحقق من وجود الملف الشخصي:", error);
        return null;
      }
      
      if (profile) {
        console.log("تم العثور على ملف شخصي موجود:", profile);
        return profile;
      }
      
      // إنشاء ملف شخصي جديد إذا لم يكن موجودًا
      console.log("لم يتم العثور على ملف شخصي. إنشاء ملف جديد...");
      
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email || '';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId,
            username: userEmail.split('@')[0],
            is_approved: true // تعيين is_approved كـ true افتراضيًا
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
      console.error("خطأ غير متوقع في التحقق من الملف الشخصي:", error);
      return null;
    }
  };

  // تحديث وظيفة fetchUserProfile لاستخدام وظيفة createUserProfileIfMissing الجديدة
  const fetchUserProfile = async (userId: string) => {
    console.log("جلب ملف المستخدم الشخصي لـ:", userId);
    
    try {
      // محاولة جلب الملف الشخصي
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // إذا لم يتم العثور على ملف شخصي، قم بإنشاء واحد جديد
        if (error.code === 'PGRST116') {
          console.log("لم يتم العثور على ملف شخصي، محاولة إنشاء واحد جديد");
          const newProfile = await createUserProfileIfMissing(userId);
          setUserProfile(newProfile);
          return newProfile;
        }
        
        console.error("خطأ في جلب الملف الشخصي:", error);
        return null;
      }
      
      console.log("تم جلب الملف الشخصي بنجاح:", profile);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error("خطأ غير متوقع في جلب الملف الشخصي:", error);
      return null;
    }
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
        
        // التحقق من وجود ملف شخصي أو إنشاء ملف جديد
        const profile = await createUserProfileIfMissing(data.user.id);
        
        if (!profile) {
          console.warn("لم يتم العثور على ملف شخصي ولم يتم إنشاء ملف جديد");
        } else if (!profile.is_approved) {
          console.warn("حساب المستخدم غير معتمد:", profile);
          // يمكن إضافة منطق خاص للتعامل مع الحسابات غير المعتمدة
        }
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

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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
    fetchUserProfile
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
