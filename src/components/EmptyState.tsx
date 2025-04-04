
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 bg-muted/20 rounded-lg border border-dashed border-muted">
      <div className="bg-muted/40 rounded-full p-4">
        {icon}
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action && (
        <div className="pt-4">
          {action}
        </div>
      )}
    </div>
  );
};
