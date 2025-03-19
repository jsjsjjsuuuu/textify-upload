
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import ConnectionStatusIndicator from '@/components/ui/connection-status-indicator';
import { Button } from './ui/button';

const AppHeader = () => {
  const { setTheme, theme } = useTheme();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // أضفنا الدالة toggleTheme لتبديل السمة بين الفاتح والداكن
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="mr-4 hidden md:flex">
            <nav className="flex items-center gap-6 text-sm">
              <Link to="/" className={`transition-colors hover:text-foreground/80 ${isActive('/') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                الرئيسية
              </Link>
              <Link to="/bookmarklet" className={`transition-colors hover:text-foreground/80 ${isActive('/bookmarklet') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                أدوات سطر العناوين
              </Link>
              <Link to="/records" className={`transition-colors hover:text-foreground/80 ${isActive('/records') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                السجلات
              </Link>
              <Link to="/api-settings" className={`transition-colors hover:text-foreground/80 ${isActive('/api-settings') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                إعدادات API
              </Link>
              <Link to="/server-settings" className={`transition-colors hover:text-foreground/80 ${isActive('/server-settings') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                إعدادات الخادم
              </Link>
            </nav>
          </div>
          <div className="flex items-center justify-end gap-4">
            <ConnectionStatusIndicator />
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
    </header>
  );
};

export default AppHeader;
