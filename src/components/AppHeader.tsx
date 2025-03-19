
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import ConnectionStatusIndicator from '@/components/ui/connection-status-indicator';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { isConnected } from '@/utils/automationServerUrl';

const AppHeader = () => {
  const { setTheme, theme } = useTheme();
  const location = useLocation();
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // التحقق من حالة الاتصال بالخادم عند تحميل الصفحة
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const connected = await isConnected();
        setServerConnected(connected);
        
        // عرض إشعار للمستخدم إذا كان الخادم غير متصل
        if (!connected) {
          toast.warning(
            "خادم Render غير متصل",
            {
              description: "تعذر الاتصال بخادم الأتمتة. قد تكون بعض الميزات غير متاحة.",
              duration: 7000,
              action: {
                label: "الإعدادات",
                onClick: () => {
                  window.location.href = '/server-settings';
                }
              }
            }
          );
        }
      } catch (error) {
        console.error("خطأ في التحقق من حالة الخادم:", error);
      }
    };
    
    checkServerConnection();
  }, []);

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
            <div className="flex items-center space-x-2">
              <ConnectionStatusIndicator 
                showText={true} 
                className="bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md"
                onStatusChange={setServerConnected}
              />
            </div>
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
