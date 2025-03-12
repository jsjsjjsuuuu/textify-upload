
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, SupabaseUser } from "@/lib/supabase";

// نوع بيانات المستخدم
export interface User {
  id: string;
  username: string;
  role: "admin" | "user" | "agent";
  isLoggedIn: boolean;
  email?: string;
}

// سياق المصادقة
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false
});

// قائمة المستخدمين الافتراضية (للاختبار فقط، سيتم استبدالها بمصادقة Supabase)
const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "admin" as const },
  { username: "user", password: "user123", role: "user" as const },
  { username: "agent", password: "agent123", role: "agent" as const }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // تحويل مستخدم Supabase إلى مستخدم التطبيق
  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'مستخدم',
      role: (supabaseUser.app_metadata?.role as "admin" | "user" | "agent") || "user",
      isLoggedIn: true,
      email: supabaseUser.email
    };
  };

  // التحقق من حالة المصادقة عند تحميل التطبيق
  useEffect(() => {
    // محاولة استرداد جلسة المستخدم المحلية أولاً
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        console.log("تم استرداد بيانات المستخدم المحلية:", parsedUser);
      } catch (error) {
        console.error("خطأ في تحليل بيانات المستخدم المخزنة:", error);
        localStorage.removeItem("user");
      }
    }

    // محاولة استعادة جلسة Supabase
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const mappedUser = mapSupabaseUser(session.user as any);
          setUser(mappedUser);
          localStorage.setItem("user", JSON.stringify(mappedUser));
          console.log("تم استرداد جلسة Supabase:", mappedUser);
        }
      }).catch(error => {
        console.warn("تعذر استرداد جلسة Supabase:", error);
      });

      // الاستماع لتغييرات حالة المصادقة
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const mappedUser = mapSupabaseUser(session.user as any);
          setUser(mappedUser);
          localStorage.setItem("user", JSON.stringify(mappedUser));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem("user");
          navigate('/login');
        }
      });

      // إلغاء الاشتراك عند الإلغاء
      return () => {
        try {
          authListener.subscription.unsubscribe();
        } catch (error) {
          console.warn("خطأ عند إلغاء الاشتراك من مستمع المصادقة:", error);
        }
      };
    } catch (error) {
      console.error("خطأ في إعداد Supabase:", error);
    }
  }, [navigate]);

  // التحقق من الصفحات المحمية
  useEffect(() => {
    const protectedRoutes = ["/records", "/api"];
    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route) || location.pathname === "/"
    );
    
    if (isProtectedRoute && !user) {
      navigate("/login");
    }
  }, [location, user, navigate]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // محاولة تسجيل الدخول باستخدام Supabase
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!error && data.user) {
          const mappedUser = mapSupabaseUser(data.user as any);
          setUser(mappedUser);
          localStorage.setItem("user", JSON.stringify(mappedUser));
          console.log("تم تسجيل الدخول بنجاح مع Supabase:", mappedUser);
          return true;
        } else if (error) {
          console.warn("خطأ في تسجيل الدخول مع Supabase:", error.message);
        }
      } catch (supabaseError) {
        console.warn("تعذر تسجيل الدخول مع Supabase:", supabaseError);
      }
      
      // للتوافق مع التطبيق في مرحلة الانتقال، نحاول تسجيل الدخول بالمستخدمين الافتراضيين
      console.log("محاولة تسجيل الدخول باستخدام المستخدمين الافتراضيين", email);
      const foundUser = DEFAULT_USERS.find(
        (u) => (u.username === email || `${u.username}@example.com` === email) && u.password === password
      );

      if (foundUser) {
        const userObj: User = {
          id: `local-${Date.now()}`,
          username: foundUser.username,
          role: foundUser.role,
          isLoggedIn: true,
          email: `${foundUser.username}@example.com`
        };
        
        setUser(userObj);
        localStorage.setItem("user", JSON.stringify(userObj));
        console.log("تم تسجيل الدخول بنجاح مع المستخدم المحلي:", userObj);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("خطأ غير متوقع أثناء تسجيل الدخول:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // تسجيل الخروج من Supabase
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn("تعذر تسجيل الخروج من Supabase:", error);
      }
      
      // تنظيف الحالة المحلية
      setUser(null);
      localStorage.removeItem("user");
      navigate("/login");
      console.log("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("خطأ أثناء تسجيل الخروج:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
