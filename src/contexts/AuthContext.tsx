
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SubscriptionPlan = 'standard' | 'vip' | 'pro';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: {
    isApproved: boolean;
    subscriptionPlan: SubscriptionPlan;
    fullName: string;
    avatarUrl: string;
  } | null;
  loading: boolean;
  emailConfirmationSent: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any, user?: User | null }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any, emailConfirmationSent?: boolean }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: any, sent: boolean }>;
  resetPassword: (newPassword: string) => Promise<{ error: any, success: boolean }>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AuthContextType['userProfile']>(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const { toast } = useToast();

  // جلب بيانات الملف الشخصي
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("جلب بيانات الملف الشخصي للمستخدم:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, is_approved, subscription_plan')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('خطأ في جلب بيانات الملف الشخصي:', error);
        return;
      }
      
      console.log("تم استلام بيانات الملف الشخصي:", data);

      setUserProfile({
        isApproved: data?.is_approved || false,
        subscriptionPlan: (data?.subscription_plan as SubscriptionPlan) || 'standard',
        fullName: data?.full_name || '',
        avatarUrl: data?.avatar_url || '',
      });
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
    }
  };

  // تحديث بيانات الملف الشخصي
  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    // تعيين مستمع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("تغيير حالة المصادقة:", event, newSession ? "مسجل الدخول" : "غير مسجل الدخول");
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // تأخير استدعاء Supabase مرة أخرى لتجنب التعارض
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // التحقق من الجلسة الحالية عند تحميل الصفحة
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("التحقق من جلسة المستخدم:", currentSession ? "موجودة" : "غير موجودة");
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("محاولة تسجيل الدخول للمستخدم:", email);
      
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("فشل تسجيل الدخول:", error.message);
        
        toast({
          title: "فشل تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      // التحقق مما إذا كان الحساب معتمداً
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', data.user.id)
        .maybeSingle();  // استخدام maybeSingle بدلاً من single لتجنب الأخطاء إذا لم يتم العثور على الملف الشخصي
      
      if (profileError) {
        console.error("خطأ في التحقق من حالة الحساب:", profileError.message);
        
        toast({
          title: "خطأ",
          description: "لا يمكن التحقق من حالة الحساب",
          variant: "destructive",
        });
        return { error: profileError, user: null };
      }
      
      // إذا لم يتم العثور على ملف شخصي، فسنفترض أن الحساب معتمد
      const isApproved = profileData ? profileData.is_approved : true;
      
      console.log("حالة اعتماد الحساب:", isApproved);
      
      if (!isApproved) {
        // تسجيل الخروج تلقائياً إذا لم يتم اعتماد الحساب
        await supabase.auth.signOut();
        
        toast({
          title: "الحساب قيد المراجعة",
          description: "لم تتم الموافقة على حسابك بعد. يرجى الانتظار حتى يتم مراجعته من قبل المسؤول.",
          variant: "destructive",
        });
        
        return { error: { message: "الحساب قيد المراجعة" }, user: null };
      }
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبًا بك مجددًا!",
      });
      
      return { error: null, user: data.user };
    } catch (error: any) {
      console.error("خطأ غير متوقع أثناء تسجيل الدخول:", error);
      
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
      return { error, user: null };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            ...metadata,
            subscription_plan: metadata?.subscription_plan || 'standard',
          }
        } 
      });
      
      if (error) {
        toast({
          title: "فشل التسجيل",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      if (data?.user) {
        // تحديث الملف الشخصي بمعلومات الاشتراك
        await supabase
          .from('profiles')
          .update({
            subscription_plan: metadata?.subscription_plan || 'standard',
            full_name: metadata?.full_name || '',
          })
          .eq('id', data.user.id);
      }
      
      if (data?.user && !data?.session) {
        setEmailConfirmationSent(true);
        toast({
          title: "تم إرسال رسالة التأكيد",
          description: "يرجى التحقق من بريدك الإلكتروني وتأكيد الحساب. سيتم مراجعة حسابك من قبل المسؤول.",
        });
        return { error: null, emailConfirmationSent: true };
      }
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "تم تسجيل الخروج",
        description: "لقد قمت بتسجيل الخروج بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      // استخدام URL مطلق للتوجيه
      const redirectTo = window.location.origin + "/reset-password";
      console.log("URL إعادة التوجيه لإعادة تعيين كلمة المرور:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) {
        console.error("خطأ في إرسال رابط إعادة تعيين كلمة المرور:", error.message);
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
        return { error, sent: false };
      }

      console.log("تم إرسال رابط إعادة تعيين كلمة المرور بنجاح");
      toast({
        title: "تم إرسال رابط إعادة تعيين كلمة المرور",
        description: "يرجى التحقق من بريدك الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور الخاصة بك",
      });

      return { error: null, sent: true };
    } catch (error: any) {
      console.error("خطأ غير متوقع:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
      return { error, sent: false };
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      console.log("محاولة إعادة تعيين كلمة المرور");
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("خطأ في إعادة تعيين كلمة المرور:", error.message);
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
        return { error, success: false };
      }

      console.log("تم إعادة تعيين كلمة المرور بنجاح");
      toast({
        title: "تم تغيير كلمة المرور بنجاح",
        description: "يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة",
      });

      return { error: null, success: true };
    } catch (error: any) {
      console.error("خطأ غير متوقع:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
      return { error, success: false };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userProfile,
      loading, 
      emailConfirmationSent,
      signIn, 
      signUp, 
      signOut,
      forgotPassword,
      resetPassword,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
