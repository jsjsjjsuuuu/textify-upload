
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

      if (data) {
        setUserProfile({
          isApproved: data.is_approved || false,
          subscriptionPlan: (data.subscription_plan as SubscriptionPlan) || 'standard',
          fullName: data.full_name || '',
          avatarUrl: data.avatar_url || '',
        });
      } else {
        console.log("لم يتم العثور على ملف شخصي للمستخدم:", userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('خطأ غير متوقع في جلب الملف الشخصي:', error);
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
    
    // تكوين Supabase للاستخدام المستمر للجلسة
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("الجلسة الحالية:", currentSession ? "موجودة" : "غير موجودة");
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      }
      
      setLoading(false);
    });
    
    // 1. ضبط مستمع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("تغيير حالة المصادقة:", event, newSession ? "مسجل الدخول" : "غير مسجل الدخول");
        
        // تعيين الجلسة والمستخدم
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // إذا كان هناك مستخدم، جلب الملف الشخصي
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
      
      // إذا لم يتم العثور على ملف شخصي، إنشاء ملف شخصي جديد
      if (!profileData) {
        console.log("إنشاء ملف شخصي جديد للمستخدم:", data.user.id);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id,
              is_approved: true,
              subscription_plan: 'standard'
            }
          ]);
          
        if (insertError) {
          console.error("خطأ في إنشاء ملف شخصي جديد:", insertError.message);
          
          // عدم إيقاف عملية تسجيل الدخول في حالة فشل إنشاء الملف الشخصي
          toast({
            title: "تحذير",
            description: "تم تسجيل الدخول ولكن هناك مشكلة في ملفك الشخصي",
            variant: "default",
          });
        }
        
        // تعيين القيم الافتراضية للملف الشخصي
        setUserProfile({
          isApproved: true,
          subscriptionPlan: 'standard',
          fullName: '',
          avatarUrl: '',
        });
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحبًا بك!",
        });
        
        return { error: null, user: data.user };
      }
      
      // إذا كان هناك ملف شخصي، التحقق من حالة الاعتماد
      const isApproved = profileData.is_approved;
      
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
        // إنشاء ملف شخصي جديد
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            subscription_plan: metadata?.subscription_plan || 'standard',
            full_name: metadata?.full_name || '',
            is_approved: false // الإعداد الافتراضي هو عدم الموافقة حتى يتم المراجعة
          }]);
          
        if (profileError) {
          console.error("خطأ في إنشاء الملف الشخصي:", profileError.message);
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
      
      // إعادة تعيين حالة المستخدم والجلسة بعد تسجيل الخروج
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
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
