
import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementPanel from "@/components/admin/UserManagementPanel";
import ResetPasswordDialog from "@/components/admin/ResetPasswordDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const { userProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (userProfile) {
          setIsAdmin(userProfile.is_admin === true);
        }
      } catch (error) {
        console.error("خطأ في التحقق من حالة المسؤول:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [userProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex justify-center items-center h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري التحقق من الصلاحيات...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            <p className="font-medium">غير مصرح</p>
            <p className="text-sm mt-1">ليس لديك صلاحيات للوصول إلى لوحة الإدارة.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-3xl font-medium tracking-tight mb-1">لوحة الإدارة</h1>
        <p className="text-muted-foreground mb-6">إدارة المستخدمين والإعدادات العامة للتطبيق</p>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="settings">إعدادات التطبيق</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagementPanel />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-medium mb-4">إعدادات التطبيق</h2>
              <p className="text-muted-foreground">إعدادات التطبيق غير متوفرة حالياً. سيتم إضافتها قريباً.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* حوار إعادة تعيين كلمة المرور - سيظهر عند تفعيله */}
      <ResetPasswordDialog />
    </div>
  );
};

export default Admin;
