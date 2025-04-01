import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogIn, Moon, Sun, UserCog, UserPlus } from 'lucide-react';
import { useTheme } from 'next-themes';
const AppHeader = () => {
  const {
    user,
    userProfile,
    signOut
  } = useAuth();
  const {
    pathname
  } = useLocation();
  const navigate = useNavigate();
  const {
    setTheme,
    theme
  } = useTheme();

  // للتصحيح المباشر
  useEffect(() => {
    if (user && userProfile) {
      console.log("معلومات المستخدم في AppHeader:", {
        id: user.id,
        email: user.email,
        is_approved: userProfile?.is_approved,
        is_admin: userProfile?.is_admin,
        userProfileType: typeof userProfile?.is_admin
      });
    }
  }, [user, userProfile]);
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // تحديد ما إذا كان المستخدم مسؤولاً بطريقة أكثر صرامة للتأكد من أن القيمة دائمًا منطقية (Boolean)
  const isAdmin = userProfile?.is_admin === true;
  console.log("هل المستخدم مسؤول في AppHeader:", isAdmin, "قيمة is_admin الأصلية:", userProfile?.is_admin);
  return <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* الشعار والروابط الرئيسية */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-primary">اصيل</Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {user && <>
                
                <Link to="/records" className={`transition-colors hover:text-foreground/80 ${pathname === "/records" ? "text-foreground font-bold" : "text-foreground/60"}`}>
                  السجلات
                </Link>
                
                {/* إظهار رابط صفحة إدارة المستخدمين للمسؤولين فقط بشكل صريح */}
                {isAdmin && <Link to="/admin/approvals" className="mx-[16px] my-[15px]">
                    
                    إدارة المستخدمين
                  </Link>}
              </>}
            
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">تبديل المظهر</span>
          </Button>
          
          {user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url || `https://avatar.iran.liara.run/public/${user?.email}`} alt={user?.email || "User Avatar"} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  {userProfile?.full_name || user?.email}
                  {isAdmin && <span className="text-xs text-blue-600 block mt-1">حساب مسؤول</span>}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  الملف الشخصي
                </DropdownMenuItem>
                {isAdmin && <DropdownMenuItem onClick={() => navigate('/admin/approvals')}>
                    <UserCog className="h-4 w-4 ml-1" />
                    إدارة المستخدمين
                  </DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild className="flex items-center gap-1">
                <Link to="/login">
                  <LogIn className="h-4 w-4 ml-1" />
                  تسجيل الدخول
                </Link>
              </Button>
              <Button size="sm" asChild className="flex items-center gap-1">
                <Link to="/register">
                  <UserPlus className="h-4 w-4 ml-1" />
                  إنشاء حساب
                </Link>
              </Button>
            </div>}
        </div>
      </div>
    </header>;
};
export default AppHeader;