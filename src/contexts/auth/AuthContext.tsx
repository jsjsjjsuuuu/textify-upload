
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthContextType, UserProfile } from './types';
import { initializeSupabaseConnection, MAX_RETRY_ATTEMPTS } from './connection-manager';
import { UserProfileService } from './user-profile-service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState<any | null>(null);
  const [auth, setAuth] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userProfileService, setUserProfileService] = useState<UserProfileService | null>(null);

  // دالة لمحاولة الاتصال الأولية
  const initializeAuth = useCallback(async () => {
    if (isInitialized || isOffline) return;
    
    setIsLoading(true);
    
    const connectionResult = await initializeSupabaseConnection(0, setRetryCount);
    
    if (connectionResult.success && connectionResult.client) {
      setSupabaseClient(connectionResult.client);
      setAuth(connectionResult.client.auth);
      setConnectionError(null);
      setIsOffline(false);
      
      // إنشاء خدمة الملفات الشخصية
      setUserProfileService(new UserProfileService(connectionResult.client));
    } else {
      setConnectionError(connectionResult.connectionError);
      setIsOffline(connectionResult.isOffline);
      setIsLoading(false);
    }
  }, [isInitialized, isOffline]);

  // دالة إعادة محاولة الاتصال
  const retryConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setConnectionError(null);
    setIsOffline(false);
    setRetryCount(0);
    setIsInitialized(false);
    
    await initializeAuth();
    return !connectionError && !isOffline;
  }, [initializeAuth, connectionError, isOffline]);
  
  // تنفيذ الاتصال الأولي
  useEffect(() => {
    if (!isInitialized && !isOffline) {
      initializeAuth();
    }
  }, [initializeAuth, isInitialized, isOffline]);
  
  // تهيئة المصادقة بعد إنشاء العميل
  useEffect(() => {
    const setupAuth = async () => {
      try {
        // إذا كان هناك خطأ في الاتصال، لا نحاول تهيئة المصادقة
        if (isOffline || connectionError || !supabaseClient || isInitialized) return;
        
        setIsLoading(true);
        console.log("تهيئة خدمة المصادقة...");

        // تهيئة المصادقة: أولاً الاستماع للتغييرات، ثم جلب الجلسة الحالية
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {
          console.log("تغيرت حالة المصادقة:", event);
          
          // تحديث الجلسة والمستخدم
          setSession(currentSession);
          setUser(currentSession?.user || null);

          // إذا كان هناك مستخدم، جلب بياناته الشخصية بطريقة آمنة
          if (currentSession?.user && userProfileService) {
            setTimeout(() => {
              userProfileService.fetchUserProfile(currentSession.user.id)
                .then(profile => {
                  if (profile) setUserProfile(profile);
                });
            }, 0);
          } else {
            setUserProfile(null);
          }
        });

        // جلب الجلسة الحالية
        const { data: initialSession, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
          console.error("خطأ في الحصول على الجلسة:", sessionError.message);
        }
        
        console.log("بيانات الجلسة الأولية:", initialSession?.session ? "موجودة" : "غير موجودة");
        setSession(initialSession.session);

        // جلب بيانات المستخدم إذا كانت الجلسة موجودة
        if (initialSession.session?.user && userProfileService) {
          console.log("تم العثور على جلسة موجودة:", initialSession.session.user.id);
          setUser(initialSession.session.user);
          
          try {
            const profile = await userProfileService.fetchUserProfile(initialSession.session.user.id);
            if (profile) setUserProfile(profile);
          } catch (fetchError) {
            console.error("خطأ في جلب الملف الشخصي الأولي:", fetchError);
          }
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

    setupAuth();
  }, [supabaseClient, isInitialized, isOffline, connectionError, userProfileService]);
  
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

  // دالة جلب الملف الشخصي
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!userProfileService) return null;
    return await userProfileService.fetchUserProfile(userId);
  }, [userProfileService]);

  // تحديث الملف الشخصي
  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (!user || !userProfileService) return;
    
    console.log("إعادة تحميل الملف الشخصي للمستخدم:", user.id);
    try {
      const profile = await userProfileService.fetchUserProfile(user.id);
      if (profile) setUserProfile(profile);
    } catch (error) {
      console.error("خطأ في تحديث الملف الشخصي:", error);
    }
  }, [user, userProfileService]);

  // عمليات المصادقة
  const signIn = useCallback(async (email: string, password: string) => {
    if (!userProfileService) {
      return { error: { message: "غير متصل بالخادم" }, user: null };
    }
    return userProfileService.signIn(email, password);
  }, [userProfileService]);

  const signOut = useCallback(async () => {
    if (!userProfileService) return;
    
    try {
      await userProfileService.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  }, [userProfileService]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, plan: string) => {
    if (!userProfileService) {
      return { error: { message: "غير متصل بالخادم" }, user: null };
    }
    
    const result = await userProfileService.signUp(email, password, fullName, plan);
    
    if (result.user && userProfileService) {
      setTimeout(async () => {
        const profile = await userProfileService.createUserProfileIfMissing(result.user.id, fullName, plan);
        if (profile) setUserProfile(profile);
      }, 0);
    }
    
    return result;
  }, [userProfileService]);

  const forgotPassword = useCallback(async (email: string) => {
    if (!userProfileService) {
      return { error: { message: "غير متصل بالخادم" }, sent: false };
    }
    return userProfileService.forgotPassword(email);
  }, [userProfileService]);

  const resetPassword = useCallback(async (newPassword: string) => {
    if (!userProfileService) {
      return { error: { message: "غير متصل بالخادم" }, success: false };
    }
    return userProfileService.resetPassword(newPassword);
  }, [userProfileService]);

  const updateUser = useCallback(async (updates: any) => {
    if (!userProfileService) {
      return { data: null, error: { message: "غير متصل بالخادم" } };
    }
    return userProfileService.updateUser(updates);
  }, [userProfileService]);

  // إنشاء قيمة السياق
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

// Hook للوصول إلى سياق المصادقة
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
