
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, AlertTriangle, Wifi, Server } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import ConnectionStatusIndicator from '@/components/ui/connection-status-indicator';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { checkConnection, getLastConnectionStatus } from '@/utils/automationServerUrl';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const AppHeader = () => {
  const { setTheme, theme } = useTheme();
  const location = useLocation();
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  
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
        // التحقق من الحالة المحفوظة أولاً
        const status = getLastConnectionStatus();
        setServerConnected(status.isConnected);
        
        // ثم التحقق من الحالة الفعلية
        const result = await checkConnection();
        setServerConnected(result.isConnected);
        
        // عرض إشعار للمستخدم إذا كان الخادم غير متصل
        if (!result.isConnected && status.retryCount > 5) {
          // إظهار شريط الإشعار فقط إذا كانت هناك عدة محاولات فاشلة
          setShowConnectionBanner(true);
          
          if (location.pathname !== '/server-settings') {
            toast.warning(
              "خادم Render غير متصل",
              {
                description: "تعذر الاتصال بخادم الأتمتة. قد تكون بعض الميزات غير متاحة.",
                duration: 10000,
                action: {
                  label: "الإعدادات",
                  onClick: () => {
                    window.location.href = '/server-settings';
                  }
                }
              }
            );
          }
        } else {
          setShowConnectionBanner(false);
        }
      } catch (error) {
        console.error("خطأ في التحقق من حالة الخادم:", error);
        setServerConnected(false);
      }
    };
    
    checkServerConnection();
    
    // التحقق بشكل دوري
    const intervalId = setInterval(checkServerConnection, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [location.pathname]);

  // إغلاق شريط الإشعار
  const dismissConnectionBanner = () => {
    setShowConnectionBanner(false);
  };

  // الانتقال إلى صفحة إعدادات الخادم
  const goToServerSettings = () => {
    window.location.href = '/server-settings';
  };

  return (
    <>
      {showConnectionBanner && !serverConnected && location.pathname !== '/server-settings' && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50 mb-0 rounded-none">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700 dark:text-yellow-400">تنبيه حالة الاتصال</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400 flex justify-between items-center">
            <span>تعذر الاتصال بخادم الأتمتة على Render. قد تكون بعض الميزات غير متاحة.</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToServerSettings} className="border-yellow-500 text-yellow-700">
                <Server className="mr-1 h-4 w-4" />
                إعدادات الخادم
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissConnectionBanner} className="text-yellow-700">
                إغلاق
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex flex-1 items-center justify-between">
            <div className="mr-4 hidden md:flex">
              <nav className="flex items-center gap-6 text-sm">
                <Link to="/" className={`transition-colors hover:text-foreground/80 ${isActive('/') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                  الرئيسية
                </Link>
                <Link to="/server-automation" className={`transition-colors hover:text-foreground/80 ${isActive('/server-automation') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                  الأتمتة عبر الخادم
                </Link>
                <Link to="/records" className={`transition-colors hover:text-foreground/80 ${isActive('/records') ? 'text-foreground font-medium' : 'text-foreground/60'}`}>
                  السجلات
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
    </>
  );
};

export default AppHeader;
