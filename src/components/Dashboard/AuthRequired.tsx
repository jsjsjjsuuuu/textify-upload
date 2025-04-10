
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AuthRequired: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto max-w-md p-8 border rounded-2xl bg-card shadow-lg">
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <AlertCircle className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold mb-2">تنبيه</AlertTitle>
          <AlertDescription>
            يجب عليك تسجيل الدخول لاستخدام هذه الصفحة
          </AlertDescription>
        </Alert>

        <Button className="w-full rounded-xl" asChild>
          <a href="/login">تسجيل الدخول</a>
        </Button>
      </div>
    </div>
  );
};

export default AuthRequired;
