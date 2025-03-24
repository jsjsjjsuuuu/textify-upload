
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { Button } from './ui/button';

const AppHeader = () => {
  const { setTheme, theme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="mr-4 hidden md:flex">
            <nav className="flex items-center gap-6 text-sm">
              <Link to="/" className="text-foreground font-medium transition-colors hover:text-foreground/80">
                الرئيسية
              </Link>
            </nav>
          </div>
          <div className="flex items-center justify-end gap-4">
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
