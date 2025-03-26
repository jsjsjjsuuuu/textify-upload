import React from 'react';
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
import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { useTheme } from 'next-themes';

const AppHeader = () => {
  const { user, userProfile, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/upload"
              className={`transition-colors hover:text-foreground/80 ${pathname === "/upload" ? "text-foreground font-bold" : "text-foreground/60"}`}
            >
              تحميل الصور
            </Link>
            <Link
              to="/"
              className={`transition-colors hover:text-foreground/80 ${
                pathname === "/" || pathname === "/records" ? "text-foreground font-bold" : "text-foreground/60"
              }`}
            >
              السجلات
            </Link>
            {/* إضافة رابط لصفحة الموافقات للمسؤولين فقط */}
            {user && userProfile?.isApproved && (
              <Link
                to="/admin/approvals"
                className={`transition-colors hover:text-foreground/80 ${
                  pathname === "/admin/approvals" ? "text-foreground font-bold" : "text-foreground/60"
                }`}
              >
                إدارة المستخدمين
              </Link>
            )}
          </nav>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme => theme === "light" ? "dark" : "light")}>
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatarUrl || `https://avatar.iran.liara.run/public/${user?.email}`} alt={user?.email || "User Avatar"} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  {userProfile?.fullName || user?.email}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button>تسجيل الدخول</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
