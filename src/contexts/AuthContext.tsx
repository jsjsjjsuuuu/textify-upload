
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

  console.log("تهيئة سياق المصادقة AuthContext");

  // جلب بيانات الملف الشخصي
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("جلب بيانات الملف الشخصي للمستخدم:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, is_approved, subscription_plan')
        .eq('id', userId)
        .maybeSingle(); // استخدام maybeSingle بدلاً من single لتجنب الأخطاء

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
    console.log("تهيئة مستمع تغييرات حالة المصادقة");
    
    // 1. قم أولاً بإعداد مستمع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("تغيير حالة المصادقة:", event, newSession ? "مسجل الدخول" : "غير مسجل الدخول");
        
        // تعيين الجلسة والمستخدم فقط، بدون استدعاء وظائف Supabase أخرى
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // إذا كان هناك مستخدم، قم بتأجيل استدعاء جلب الملف الشخصي
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // 2. بعد إعداد المستمع، تحقق من الجلسة الحالية
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
      console.log("إلغاء اشتراك مستمع تغييرات حالة المصادقة");
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("محاولة تسجيل الدخول للمستخدم:", email);
      
      // استخدام تهيئة واضحة للخيارات
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) {
        console.error("فشل تسجيل الدخول:", error.message);
        
        toast({
          title: "فشل تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      console.log("نجح تسجيل الدخول، معرف المستخدم:", data.user.id);
      
      // التحقق مما إذا كان الحساب معتمداً
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', data.user.id)
        .maybeSingle();
      
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
        description: error.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول",
        variant: "destructive",
      });
      return { error, user: null };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      console.log("محاولة إنشاء حساب جديد:", email);
      
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
        console.error("فشل إنشاء الحساب:", error.message);
        
        toast({
          title: "فشل التسجيل",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      console.log("نتيجة إنشاء الحساب:", data.user ? "تم إنشاء المستخدم" : "لم يتم إنشاء المستخدم");
      
      if (data?.user) {
        // تحديث الملف الشخصي بمعلومات الاشتراك
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: metadata?.subscription_plan || 'standard',
            full_name: metadata?.full_name || '',
          })
          .eq('id', data.user.id);
          
        if (profileError) {
          console.error("خطأ في تحديث الملف الشخصي:", profileError.message);
        }
      }
      
      if (data?.user && !data?.session) {
        setEmailConfirmationSent(true);
        
        console.log("تم إرسال رسالة تأكيد البريد الإلكتروني");
        
        toast({
          title: "تم إرسال رسالة التأكيد",
          description: "يرجى التحقق من بريدك الإلكتروني وتأكيد الحساب. سيتم مراجعة حسابك من قبل المسؤول.",
        });
        return { error: null, emailConfirmationSent: true };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error("خطأ غير متوقع أثناء إنشاء الحساب:", error);
      
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ غير متوقع أثناء إنشاء الحساب",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log("محاولة تسجيل الخروج");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("خطأ أثناء تسجيل الخروج:", error.message);
        
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("تم تسجيل الخروج بنجاح");
      
      toast({
        title: "تم تسجيل الخروج",
        description: "لقد قمت بتسجيل الخروج بنجاح",
      });
    } catch (error: any) {
      console.error("خطأ غير متوقع أثناء تسجيل الخروج:", error);
      
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ غير متوقع أثناء تسجيل الخروج",
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
        description: error.message || "حدث خطأ غير متوقع أثناء إرسال رابط إعادة تعيين كلمة المرور",
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
        description: error.message || "حدث خطأ غير متوقع أثناء إعادة تعيين كلمة المرور",
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
