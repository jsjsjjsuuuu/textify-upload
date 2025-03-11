
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// نوع بيانات المستخدم
export interface User {
  username: string;
  role: "admin" | "user" | "agent";
  isLoggedIn: boolean;
}

// سياق المصادقة
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
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

// قائمة المستخدمين (للاختبار فقط، في الإنتاج يجب استخدام API)
const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "admin" as const },
  { username: "user", password: "user123", role: "user" as const },
  { username: "agent", password: "agent123", role: "agent" as const }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // التحقق من حالة تسجيل الدخول عند تحميل التطبيق
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

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

  const login = async (username: string, password: string): Promise<boolean> => {
    // محاكاة طلب تسجيل الدخول (في الإنتاج يجب استخدام API)
    const foundUser = DEFAULT_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      const userObj: User = {
        username: foundUser.username,
        role: foundUser.role,
        isLoggedIn: true
      };
      
      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
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
