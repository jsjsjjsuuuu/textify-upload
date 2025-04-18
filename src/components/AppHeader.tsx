import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  Menu,
  X,
  User,
  LogOut,
  Database,
  Users,
  Settings,
  Sun,
  Moon,
  Info,
  FileText,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const AppHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  
  console.log("هل المستخدم مسؤول في AppHeader:", userProfile?.is_admin === true, "قيمة is_admin الأصلية:", userProfile?.is_admin);
  
  // التصحيح المباشر
  console.log("معلومات المستخدم في AppHeader:", {
    id: user?.id, 
    email: user?.email, 
    is_approved: userProfile?.is_approved, 
    is_admin: userProfile?.is_admin,
    userProfileType: typeof userProfile?.is_admin
  });

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* زر القائمة (للموبايل) */}
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus:ring-0 md:hidden"
            onClick={toggleMenu}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">القائمة</span>
          </Button>

          {/* شعار الموقع */}
          <Link to="/" className="flex items-center space-x-2 space-x-reverse">
            <Wand2 className="ml-2 h-6 w-6" />
            <span className="font-bold text-xl">استخراج النصوص</span>
          </Link>

          {/* القائمة الرئيسية - سطح المكتب */}
          <nav className="hidden md:flex items-center space-x-6 space-x-reverse mx-6">
            <Link
              to="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center">
                <Database className="ml-1.5 w-4 h-4" />
                السجلات
              </div>
            </Link>
            <Link
              to="/upload"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/upload') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center">
                <UploadCloud className="ml-1.5 w-4 h-4" />
                تحميل الصور
              </div>
            </Link>
            {userProfile?.is_admin && (
              <Link
                to="/admin/approvals"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive('/admin/approvals') ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center">
                  <Users className="ml-1.5 w-4 h-4" />
                  إدارة المستخدمين
                </div>
              </Link>
            )}
            
          {/* إضافة رابط الأتمتة */}
          {userProfile?.is_admin && (
            <Link
              to="/automation"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/automation') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center">
                <Settings className="ml-1.5 w-4 h-4" />
                الأتمتة
              </div>
            </Link>
          )}
        </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* التبديل بين المظهر الفاتح والداكن */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">تبديل المظهر</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                فاتح
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                داكن
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                تلقائي
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* قائمة المستخدم */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>الحساب</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="ml-2 h-4 w-4" />
                    الملف الشخصي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">تسجيل الدخول</Link>
            </Button>
          )}
        </div>
      </div>

      {/* القائمة المتحركة للموبايل */}
      <div
        className={`fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in md:hidden ${
          isOpen ? "slide-in-from-right" : "slide-out-to-right hidden"
        } bg-background border-t`}
      >
        <div className="relative z-20 grid gap-6 rounded-md p-4">
          <Link
            to="/"
            className="flex items-center space-x-2 space-x-reverse text-sm font-medium"
            onClick={closeMenu}
          >
            <Database className="ml-1.5 w-5 h-5" />
            السجلات
          </Link>
          <Link
            to="/upload"
            className="flex items-center space-x-2 space-x-reverse text-sm font-medium"
            onClick={closeMenu}
          >
            <UploadCloud className="ml-1.5 w-5 h-5" />
            تحميل الصور
          </Link>
          {userProfile?.is_admin && (
            <Link
              to="/admin/approvals"
              className="flex items-center space-x-2 space-x-reverse text-sm font-medium"
              onClick={closeMenu}
            >
              <Users className="ml-1.5 w-5 h-5" />
              إدارة المستخدمين
            </Link>
          )}
          
            {/* إضافة رابط الأتمتة في القائمة المتحركة */}
            {userProfile?.is_admin && (
              <Link
                to="/automation"
                className="flex items-center space-x-2 space-x-reverse text-sm font-medium"
                onClick={closeMenu}
              >
                <Settings className="ml-1.5 w-5 h-5" />
                الأتمتة
              </Link>
            )}
          <Link
            to="/profile"
            className="flex items-center space-x-2 space-x-reverse text-sm font-medium"
            onClick={closeMenu}
          >
            <User className="ml-1.5 w-5 h-5" />
            الملف الشخصي
          </Link>
          <Link
            to="/services"
            className="flex items-center space-x-2 space-x-reverse text-sm font-medium"
            onClick={closeMenu}
          >
            <Info className="ml-1.5 w-5 h-5" />
            حول الخدمة
          </Link>
          <Link
            to="/policy"
            className="flex items-center space-x-2 space-x-reverse text-sm font-medium"
            onClick={closeMenu}
          >
            <FileText className="ml-1.5 w-5 h-5" />
            سياسة الاستخدام
          </Link>
          <Button onClick={handleSignOut} variant="outline" className="justify-start">
            <LogOut className="ml-2 h-5 w-5" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
      
      {/* طبقة تغطي الشاشة عند فتح القائمة */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-16 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
        />
      )}
    </header>
  );
};

export default AppHeader;
