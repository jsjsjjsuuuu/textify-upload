import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from './ThemeToggle';
import ConnectionStatusIndicator from './ui/connection-status-indicator';
import AutomaticCloudServer from './ui/automatic-cloud-server';
import { Button } from '@/components/ui/button';

const AppHeader = () => {
  const { pathname } = useLocation();
  const activeClasses = "text-brand-green underline underline-offset-4";
  const inactiveClasses = "hover:text-brand-green transition-colors";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden sm:inline-block font-bold sm:text-xl">
              تطبيق استخراج النصوص
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className={pathname === "/" ? activeClasses : inactiveClasses}>الرئيسية</Link>
            <Link to="/records" className={pathname === "/records" ? activeClasses : inactiveClasses}>السجلات</Link>
            <Link to="/bookmarklet" className={pathname === "/bookmarklet" ? activeClasses : inactiveClasses}>Bookmarklet</Link>
            <Link to="/api-settings" className={pathname === "/api-settings" ? activeClasses : inactiveClasses}>API</Link>
            <Link to="/server-settings" className={pathname === "/server-settings" ? activeClasses : inactiveClasses}>الخادم</Link>
            <Link to="/cloud-server" className={pathname === "/cloud-server" ? activeClasses : inactiveClasses}>الخادم السحابي</Link>
          </nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="lg:hidden">
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" alignOffset={-40} className="w-[200px]">
            <DropdownMenuItem asChild>
              <Link to="/">الرئيسية</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/records">السجلات</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/bookmarklet">Bookmarklet</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/api-settings">إعدادات API</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/server-settings">إعدادات الخادم</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/cloud-server">الخادم السحابي</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center gap-4">
            <ConnectionStatusIndicator showText={false} />
            <AutomaticCloudServer />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
