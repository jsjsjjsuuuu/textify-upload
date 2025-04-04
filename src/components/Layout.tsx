
import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      <main className="flex-1 py-8 max-w-7xl mx-auto w-full px-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
