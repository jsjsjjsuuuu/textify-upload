
import React from 'react';
import { Loader } from "lucide-react";

const AuthLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">جاري تحميل المعلومات...</p>
    </div>
  );
};

export default AuthLoading;
