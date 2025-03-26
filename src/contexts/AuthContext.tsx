
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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, is_approved, subscription_plan')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('خطأ في جلب بيانات الملف الشخصي:', error);
        return;
      }

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // تأخير استدعاء Supabase مرة أخرى لتجنب التعارض
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
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
        .single();
      
      if (profileError) {
        toast({
          title: "خطأ",
          description: "لا يمكن التحقق من حالة الحساب",
          variant: "destructive",
        });
        return { error: profileError };
      }
      
      if (!profileData.is_approved) {
        // تسجيل الخروج تلقائياً إذا لم يتم اعتماد الحساب
        await supabase.auth.signOut();
        
        toast({
          title: "الحساب قيد المراجعة",
          description: "لم تتم الموافقة على حسابك بعد. يرجى الانتظار حتى يتم مراجعته من قبل المسؤول.",
          variant: "destructive",
        });
        
        return { error: { message: "الحساب قيد المراجعة" } };
      }
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبًا بك مجددًا!",
      });
      
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

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin,
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
        return { error, sent: false };
      }

      toast({
        title: "تم إرسال رابط إعادة تعيين كلمة المرور",
        description: "يرجى التحقق من بريدك الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور الخاصة بك",
      });

      return { error: null, sent: true };
    } catch (error: any) {
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
        return { error, success: false };
      }

      toast({
        title: "تم تغيير كلمة المرور بنجاح",
        description: "يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة",
      });

      return { error: null, success: true };
    } catch (error: any) {
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
