
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
    // محاولة استعادة جلسة Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const mappedUser = mapSupabaseUser(session.user as any);
        setUser(mappedUser);
        localStorage.setItem("user", JSON.stringify(mappedUser));
      } else {
        // إذا لم يوجد جلسة Supabase، تحقق من وجود مستخدم محلي
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser) as User;
            setUser(parsedUser);
          } catch (error) {
            console.error("خطأ في تحليل بيانات المستخدم المخزنة:", error);
            localStorage.removeItem("user");
          }
        }
      }
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
      authListener.subscription.unsubscribe();
    };
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("خطأ في تسجيل الدخول مع Supabase:", error.message);
        
        // للتوافق مع التطبيق في مرحلة الانتقال، نحاول تسجيل الدخول بالمستخدمين الافتراضيين
        const foundUser = DEFAULT_USERS.find(
          (u) => u.username === email && u.password === password
        );

        if (foundUser) {
          const userObj: User = {
            id: `local-${Date.now()}`,
            username: foundUser.username,
            role: foundUser.role,
            isLoggedIn: true
          };
          
          setUser(userObj);
          localStorage.setItem("user", JSON.stringify(userObj));
          return true;
        }
        
        return false;
      }

      if (data.user) {
        const mappedUser = mapSupabaseUser(data.user as any);
        setUser(mappedUser);
        localStorage.setItem("user", JSON.stringify(mappedUser));
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
      await supabase.auth.signOut();
      // تنظيف الحالة المحلية
      setUser(null);
      localStorage.removeItem("user");
      navigate("/login");
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
