
import React from "react";
import { Link } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  FileBarChart,
  Settings2,
  Database,
  Images
} from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { SiteSwitcher } from "@/components/site-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-secondary hover:bg-secondary h-9 px-4 py-2"
    >
      {children}
    </Link>
  );
};

const AppHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 w-full border-b">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="flex items-center">
            <Logo className="h-8 w-8" />
            <span className="font-bold text-xl ml-2">ReceiptPro</span>
          </Link>
          <nav className="flex items-center space-x-6 space-x-reverse text-sm font-medium mr-6">
            <NavLink to="/">
              <Home className="h-4 w-4 ml-1" />
              الرئيسية
            </NavLink>
            <NavLink to="/dashboard">
              <LayoutDashboard className="h-4 w-4 ml-1" />
              لوحة التحكم
            </NavLink>
            <NavLink to="/receipts">
              <Images className="h-4 w-4 ml-1" />
              الوصولات
            </NavLink>
            <NavLink to="/reports">
              <FileBarChart className="h-4 w-4 ml-1" />
              التقارير
            </NavLink>
            <NavLink to="/records">
              <Database className="h-4 w-4 ml-1" />
              السجلات
            </NavLink>
            <NavLink to="/settings">
              <Settings2 className="h-4 w-4 ml-1" />
              الإعدادات
            </NavLink>
          </nav>
        </div>
        <MainNav className="mx-6" />
        <SiteSwitcher />
        <div className="ml-auto flex items-center space-x-4 space-x-reverse">
          <ThemeToggle />
          {user ? (
            <Button onClick={signOut} variant="ghost" className="text-sm font-medium hover:underline">
              تسجيل الخروج
            </Button>
          ) : (
            <UserAuthForm />
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
