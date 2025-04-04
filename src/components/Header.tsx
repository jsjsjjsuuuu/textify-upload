
import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  description?: string;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ title, description, className }) => {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-2xl font-bold tracking-tight text-center mb-2">{title}</h1>
      {description && (
        <p className="text-muted-foreground text-center text-sm md:text-base max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
};

export default Header;
