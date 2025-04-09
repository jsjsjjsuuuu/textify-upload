
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  isOffline: boolean;
  connectionError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any; user: any | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, plan: string) => Promise<{ error: any; user: any | null }>;
  forgotPassword: (email: string) => Promise<{ error: any; sent: boolean }>;
  resetPassword: (newPassword: string) => Promise<{ error: any; success: boolean }>;
  updateUser: (updates: any) => Promise<{ data: any; error: any }>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  refreshUserProfile: () => Promise<void>;
  retryConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// ثوابت إعادة المحاولة
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [auth, setAuth] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // دالة لمحاولة الاتصال
  const initializeSupabase = useCallback(async (attempt = 0) => {
    try {
      console.log(`محاولة الاتصال بـ Supabase (${attempt + 1}/${MAX_RETRY_ATTEMPTS})...`);
      
      // التحقق من الاتصال بالإنترنت
      if (!navigator.onLine) {
        setIsOffline(true);
        setConnectionError("لا يوجد اتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.");
        console.error("لا يوجد اتصال بالإنترنت");
        setIsLoading(false);
        return false;
      }
      
      // محاولة تهيئة العميل
      const client = supabase;
      
      // التحقق من الاتصال عبر استعلام بسيط
      const { error } = await client.from('profiles').select('count').limit(1).maybeSingle();
      
      if (error) {
        console.error("خطأ في الاتصال بـ Supabase:", error.message);
        
        // إذا وصلنا للحد الأقصى من المحاولات
        if (attempt >= MAX_RETRY_ATTEMPTS - 1) {
          setConnectionError(`تعذر الاتصال بالخادم. ${error.message}`);
          setIsOffline(true);
          setIsLoading(false);
          return false;
        }
        
        // إعادة المحاولة بعد تأخير
        console.log(`إعادة المحاولة بعد ${RETRY_DELAY_MS}ms...`);
        setRetryCount(attempt + 1);
        
        // انتظار ثم إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return initializeSupabase(attempt + 1);
      }
      
      // نجاح الاتصال
      console.log("تم الاتصال بـ Supabase بنجاح");
      setSupabaseClient(client);
      setAuth(client.auth);
      setConnectionError(null);
      setIsOffline(false);
      return true;
    } catch (error: any) {
      console.error("خطأ غير متوقع في الاتصال:", error.message);
      
      // إذا وصلنا للحد الأقصى من المحاولات
      if (attempt >= MAX_RETRY_ATTEMPTS - 1) {
        setConnectionError(`خطأ غير متوقع: ${error.message}`);
        setIsOffline(true);
        setIsLoading(false);
        return false;
      }
      
      // إعادة المحاولة بعد تأخير
      console.log(`إعادة المحاولة بعد ${RETRY_DELAY_MS}ms...`);
      setRetryCount(attempt + 1);
      
      // انتظار ثم إعادة المحاولة
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return initializeSupabase(attempt + 1);
    }
  }, []);

  // دالة إعادة محاولة الاتصال
  const retryConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setConnectionError(null);
    setIsOffline(false);
    setRetryCount(0);
    
    const success = await initializeSupabase();
    
    if (success) {
      setIsInitialized(false); // إعادة تعيين الحالة
      // لا نقوم بتعيين setIsLoading(false) هنا لأن useEffect سيتولى ذلك
    } else {
      setIsLoading(false);
    }
    
    return success;
  }, [initializeSupabase]);
  
  // تحسين عملية تهيئة المصادقة لتجنب التحديثات المتكررة
  useEffect(() => {
    const setupAuth = async () => {
      try {
        // إذا كان هناك خطأ في الاتصال، لا نحاول تهيئة المصادقة
        if (isOffline || connectionError) {
          return;
        }
        
        if (isInitialized || !supabaseClient) return;
        
        setIsLoading(true);
        console.log("تهيئة خدمة المصادقة...");

        // أولاً، إعداد الاستماع لأحداث تغيير حالة المصادقة
        const {
          data: { subscription },
        } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
          console.log("تغيرت حالة المصادقة:", event);
          
          // تحديث حالة الجلسة والمستخدم بطريقة آمنة
          setSession(currentSession);
          setUser(currentSession?.user || null);

          // استخدام setTimeout لكسر التسلسل المباشر وتجنب الحلقات اللانهائية
          if (currentSession?.user) {
            setTimeout(() => {
              fetchUserProfileSafely(currentSession.user.id);
            }, 0);
          } else {
            setUserProfile(null);
          }
        });

        // ثم، الحصول على الجلسة الحالية
        const { data: initialSession, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
          console.error("خطأ في الحصول على الجلسة:", sessionError.message);
          // لا نتوقف هنا، نحاول المتابعة على أي حال
        }
        
        console.log("بيانات الجلسة الأولية:", initialSession?.session ? "موجودة" : "غير موجودة");
        setSession(initialSession.session);

        // جلب بيانات المستخدم إذا كانت الجلسة موجودة
        if (initialSession.session?.user) {
          console.log("تم العثور على جلسة موجودة:", initialSession.session.user.id);
          setUser(initialSession.session.user);
          
          await fetchUserProfileSafely(initialSession.session.user.id);
        } else {
          console.log("لم يتم العثور على جلسة موجودة");
        }

        setIsInitialized(true);
        setIsLoading(false);

        // إلغاء الاشتراك عند إغلاق المكون
        return () => {
          subscription.unsubscribe();
        };
      } catch (error: any) {
        console.error("خطأ في تهيئة المصادقة:", error.message);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    if (supabaseClient) {
      setupAuth();
    }
  }, [supabaseClient, isInitialized, isOffline, connectionError]);

  // محاولة الاتصال الأولية
  useEffect(() => {
    if (!isInitialized && !isOffline) {
      initializeSupabase();
    }
  }, [initializeSupabase, isInitialized, isOffline]);
  
  // مراقبة حالة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => {
      console.log("تم استعادة الاتصال بالإنترنت");
      setIsOffline(false);
      if (connectionError) {
        retryConnection();
      }
    };
    
    const handleOffline = () => {
      console.log("انقطع الاتصال بالإنترنت");
      setIsOffline(true);
      setConnectionError("لا يوجد اتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionError, retryConnection]);

  // طريقة آمنة لجلب الملف الشخصي بدون تكرار لانهائي
  const fetchUserProfileSafely = async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!supabaseClient) return null;
      
      console.log("جلب ملف المستخدم الشخصي بطريقة آمنة:", userId);
      
      const { data, error } = await supabaseClient
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
        return await createUserProfileIfMissing(userId);
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
      if (!supabaseClient) return null;
      
      const { data: userData } = await supabaseClient.auth.getUser();
      const userEmail = userData.user?.email || '';
      
      // التحقق أولاً من عدم وجود الملف الشخصي (تجنب الإدخالات المكررة)
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (existingProfile) {
        console.log("الملف الشخصي موجود بالفعل:", existingProfile.id);
        // جلب الملف الشخصي الكامل وإعادته
        return await fetchUserProfileSafely(userId);
      }
      
      const { data: newProfile, error: insertError } = await supabaseClient
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
      if (!supabaseClient) {
        return { error: { message: "غير متصل بالخادم" }, user: null };
      }
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("خطأ في تسجيل الدخول:", error.message);
        return { error, user: null };
      }
      
      if (data.user) {
        console.log("تم تسجيل الدخول بنجاح، جلب الملف الشخصي");
        setTimeout(() => {
          fetchUserProfileSafely(data.user.id);
        }, 0);
      }
      
      return { error: null, user: data.user };
    } catch (error: any) {
      console.error("خطأ غير متوقع في تسجيل الدخول:", error);
      return { error: { message: error.message }, user: null };
    }
  };

  const signOut = async () => {
    try {
      if (!supabaseClient) return;
      
      await supabaseClient.auth.signOut();
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
      
      if (!supabaseClient) {
        return { error: { message: "غير متصل بالخادم" }, user: null };
      }
      
      const { data, error } = await supabaseClient.auth.signUp({
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
      
      // إنشاء ملف شخصي للمستخدم عند التسجيل فقط إذا تم إنشاء المستخدم بنجاح
      if (data.user) {
        console.log("جاري إنشاء الملف الشخصي للمستخدم الجديد");
        setTimeout(async () => {
          await createUserProfileIfMissing(data.user.id, fullName, plan);
        }, 0);
      }

      return { error: null, user: data.user };
    } catch (error: any) {
      console.error("خطأ غير متوقع في التسجيل:", error);
      return { error: { message: error.message }, user: null };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      if (!supabaseClient) {
        return { error: { message: "غير متصل بالخادم" }, sent: false };
      }
      
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
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
      if (!supabaseClient) {
        return { error: { message: "غير متصل بالخادم" }, success: false };
      }
      
      const { data, error } = await supabaseClient.auth.updateUser({
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
      if (!supabaseClient) {
        return { data: null, error: { message: "غير متصل بالخادم" } };
      }
      
      const { data, error } = await supabaseClient.auth.updateUser(updates);

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
    isOffline,
    connectionError,
    signIn,
    signOut,
    signUp,
    forgotPassword,
    resetPassword,
    updateUser,
    fetchUserProfile,
    refreshUserProfile,
    retryConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
