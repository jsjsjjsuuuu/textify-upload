
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Company } from "@/types/Company";
import { fetchCompanies } from "@/lib/supabaseService";
import { useToast } from "@/hooks/use-toast";

// نوع بيانات المستخدم
export interface User {
  username: string;
  role: "admin" | "user" | "agent";
  isLoggedIn: boolean;
  companies?: Company[]; // قائمة الشركات المرتبطة بالمستخدم
  activeCompanyId?: string; // معرف الشركة النشطة حاليًا
}

// سياق المصادقة
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  switchCompany: (companyId: string) => void;
  companies: Company[];
  activeCompany: Company | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  switchCompany: () => {},
  companies: [],
  activeCompany: null
});

// قائمة المستخدمين (للاختبار فقط، في الإنتاج يجب استخدام API)
const DEFAULT_USERS = [
  { 
    username: "admin", 
    password: "admin123", 
    role: "admin" as const,
    companies: ["company-1", "company-2"] // الشركات المرتبطة بالمستخدم
  },
  { 
    username: "user", 
    password: "user123", 
    role: "user" as const,
    companies: ["company-1"]
  },
  { 
    username: "agent", 
    password: "agent123", 
    role: "agent" as const,
    companies: ["company-2"]
  }
];

// قائمة الشركات المبدئية
const DEFAULT_COMPANIES: Company[] = [
  { id: "company-1", name: "الشلال للتوصيل", logoUrl: "/logo-shalal.png" },
  { id: "company-2", name: "خط الناقل", logoUrl: "/logo-nakil.png" }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // تحميل الشركات عند بدء التطبيق
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { success, data } = await fetchCompanies();
        
        if (success && data && data.length > 0) {
          // تحويل البيانات من قاعدة البيانات إلى نموذج Company
          const loadedCompanies: Company[] = data.map(dbCompany => ({
            id: dbCompany.id,
            name: dbCompany.name,
            logoUrl: dbCompany.logo_url,
            createdAt: new Date(dbCompany.created_at),
            updatedAt: new Date(dbCompany.updated_at)
          }));
          
          setCompanies(loadedCompanies);
        } else {
          // استخدام الشركات الافتراضية إذا لم تكن هناك شركات في قاعدة البيانات
          setCompanies(DEFAULT_COMPANIES);
        }
      } catch (error) {
        console.error("خطأ في تحميل الشركات:", error);
        // استخدام الشركات الافتراضية في حالة الخطأ
        setCompanies(DEFAULT_COMPANIES);
      }
    };
    
    loadCompanies();
  }, []);

  // التحقق من حالة تسجيل الدخول عند تحميل التطبيق
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        
        // تعيين الشركة النشطة إذا كان هناك شركة نشطة مخزنة
        if (parsedUser.activeCompanyId) {
          const company = companies.find(c => c.id === parsedUser.activeCompanyId);
          if (company) {
            setActiveCompany(company);
          }
        }
        
        // إذا كان المستخدم مسجل الدخول وكان في صفحة تسجيل الدخول، توجيهه للصفحة الرئيسية
        if (location.pathname === "/login") {
          navigate("/");
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
  }, [location.pathname, navigate, companies]);

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
      // تحديد الشركات المرتبطة بالمستخدم
      const userCompanies = companies.filter(company => 
        foundUser.companies.includes(company.id)
      );
      
      // تعيين الشركة النشطة افتراضيًا كأول شركة في القائمة
      const firstCompany = userCompanies.length > 0 ? userCompanies[0] : null;
      
      const userObj: User = {
        username: foundUser.username,
        role: foundUser.role,
        isLoggedIn: true,
        companies: userCompanies,
        activeCompanyId: firstCompany?.id
      };
      
      setUser(userObj);
      if (firstCompany) {
        setActiveCompany(firstCompany);
      }
      
      localStorage.setItem("user", JSON.stringify(userObj));
      
      // إظهار رسالة ترحيب
      toast({
        title: "مرحبًا بك",
        description: `تم تسجيل الدخول بنجاح باسم ${userObj.username}${firstCompany ? ` إلى ${firstCompany.name}` : ''}`,
      });
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setActiveCompany(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  // تبديل الشركة النشطة
  const switchCompany = (companyId: string) => {
    if (!user) return;
    
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      console.error("الشركة غير موجودة:", companyId);
      return;
    }
    
    // تحديث الشركة النشطة في كائن المستخدم
    const updatedUser = {
      ...user,
      activeCompanyId: companyId
    };
    
    setUser(updatedUser);
    setActiveCompany(company);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    // إعادة تحميل الصفحة الحالية لتحديث البيانات
    if (location.pathname === "/") {
      window.location.reload();
    } else {
      navigate("/");
    }
    
    // إظهار رسالة تأكيد
    toast({
      title: "تم تبديل الشركة",
      description: `تم التبديل إلى ${company.name}`,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        switchCompany,
        companies,
        activeCompany
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
