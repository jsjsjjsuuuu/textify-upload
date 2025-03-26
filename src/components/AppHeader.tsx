
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Menu, X, User } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { Button } from './ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

const AppHeader = () => {
  const { setTheme, theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="mr-4 hidden md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className={cn(navigationMenuTriggerStyle(), "px-4")}>
                    الرئيسية
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/services" className={cn(navigationMenuTriggerStyle(), "px-4")}>
                    خدماتنا
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/policy" className={cn(navigationMenuTriggerStyle(), "px-4")}>
                    سياسة الخصوصية
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          {/* زر القائمة للشاشات الصغيرة */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-end gap-4">
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <User className="mr-2 h-4 w-4" />
                    الملف الشخصي
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="hidden md:flex"
                >
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="default" size="sm" className="hidden md:flex">
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle Theme"
              className="mr-2"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* قائمة للشاشات الصغيرة */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b py-2">
          <nav className="container flex flex-col space-y-2">
            <Link 
              to="/" 
              className="px-4 py-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              الرئيسية
            </Link>
            <Link 
              to="/services" 
              className="px-4 py-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              خدماتنا
            </Link>
            <Link 
              to="/policy" 
              className="px-4 py-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              سياسة الخصوصية
            </Link>
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="px-4 py-2 hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  الملف الشخصي
                </Link>
                <Button 
                  variant="ghost" 
                  className="justify-start px-4 py-2 h-auto hover:bg-accent rounded-md text-right"
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                >
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2 hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  تسجيل الدخول
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  إنشاء حساب
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
