
import React from 'react';
import { ImageIcon, AlertCircle, FileIcon, InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyContentProps {
  title: string;
  description: string;
  icon?: 'image' | 'file' | 'alert' | 'inbox';
  className?: string;
}

export const EmptyContent: React.FC<EmptyContentProps> = ({
  title,
  description,
  icon = 'alert',
  className
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'image':
        return <ImageIcon className="h-12 w-12 text-muted-foreground/60" />;
      case 'file':
        return <FileIcon className="h-12 w-12 text-muted-foreground/60" />;
      case 'inbox':
        return <InboxIcon className="h-12 w-12 text-muted-foreground/60" />;
      case 'alert':
      default:
        return <AlertCircle className="h-12 w-12 text-muted-foreground/60" />;
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed text-center",
      className
    )}>
      <div className="mb-4">
        {getIcon()}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
};
