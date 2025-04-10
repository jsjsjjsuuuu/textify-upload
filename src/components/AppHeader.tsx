
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, UserCog, Database, Upload, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';

const AppHeader = () => {
  const { user, userProfile, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // التحقق من تحميل الصفحة لتجنب مشاكل SSR
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
    navigate('/login');
  };
  
  // تحديد ما إذا كان المستخدم مسؤولاً بطريقة أكثر صرامة للتأكد من أن القيمة دائمًا منطقية (Boolean)
  const isAdmin = userProfile?.is_admin === true;
  console.log("هل المستخدم مسؤول في AppHeader:", isAdmin, "قيمة is_admin الأصلية:", userProfile?.is_admin);
  
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center space-x-2 ml-6 mr-6 font-bold text-xl">
          <span className="hidden md:inline">لوحة التحكم</span>
        </Link>
        
        <nav className="flex items-center justify-center flex-1">
          <div className="flex items-center space-x-1 md:space-x-4 rtl:space-x-reverse">
            <Link
              to="/upload"
              className={`transition-colors hover:text-foreground/80 px-3 py-2 rounded-md ${pathname === "/upload" ? "text-foreground font-bold bg-primary/10" : "text-foreground/60"}`}
            >
              <Upload className="h-4 w-4 inline-block ml-1" />
              تحميل الصور
            </Link>
            <Link
              to="/records"
              className={`transition-colors hover:text-foreground/80 px-3 py-2 rounded-md ${
                pathname === "/records" ? "text-foreground font-bold bg-primary/10" : "text-foreground/60"
              }`}
            >
              <Database className="h-4 w-4 inline-block ml-1" />
              السجلات
            </Link>
            
            {/* إظهار رابط صفحة إدارة المستخدمين للمسؤولين فقط بشكل صريح */}
            {isAdmin && (
              <Link
                to="/admin/approvals"
                className={`transition-colors hover:text-foreground/80 flex items-center px-3 py-2 rounded-md ${
                  pathname === "/admin/approvals" ? "text-foreground font-bold bg-primary/10" : "text-foreground/60"
                }`}
              >
                <UserCog className="h-4 w-4 ml-1" />
                إدارة المستخدمين
              </Link>
            )}
          </div>
        </nav>
        
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          {/* زر تبديل السمة (الوضع المظلم/الفاتح) */}
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full" 
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "dark" ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">تبديل السمة</span>
            </Button>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                    <AvatarImage src={userProfile?.avatar_url || `https://avatar.iran.liara.run/public/${user?.email}`} alt={user?.email || "User Avatar"} />
                    <AvatarFallback className="bg-primary/10 text-primary">{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.full_name || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    {isAdmin && (
                      <span className="text-xs text-primary block mt-1 bg-primary/10 rounded-full px-2 py-0.5 w-fit">مسؤول</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  الملف الشخصي
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin/approvals')} className="cursor-pointer">
                    <UserCog className="h-4 w-4 ml-2" />
                    إدارة المستخدمين
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button className="rounded-full">تسجيل الدخول</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
