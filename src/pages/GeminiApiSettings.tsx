
import React from 'react';
import AppHeader from '@/components/AppHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import GeminiApiKeyManager from '@/components/ApiKeyManager/GeminiApiKeyManager';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const GeminiApiSettings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  // التحقق من الصلاحيات
  const isAdmin = userProfile?.is_admin === true;
  
  // إعادة التوجيه إذا لم يكن المستخدم مسؤولاً
  if (!isAdmin && user) {
    toast({
      title: "خطأ في الصلاحيات",
      description: "ليس لديك صلاحية للوصول إلى هذه الصفحة",
      variant: "destructive"
    });
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-6">
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-2xl flex items-center">
              <span className="bg-primary text-primary-foreground p-1 rounded-md text-sm ml-2">إعدادات متقدمة</span>
              إدارة مفاتيح Gemini API
            </CardTitle>
            <CardDescription className="text-lg">
              قم بإدارة مفاتيح Gemini API للنظام بأكمله. ستكون هذه المفاتيح متاحة لجميع المستخدمين لمعالجة الصور.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <GeminiApiKeyManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeminiApiSettings;
