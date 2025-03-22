
import React, { useState, useEffect } from 'react';
import AutomationController from '@/components/ServerAutomation/AutomationController';
import SavedAutomations from '@/components/ServerAutomation/SavedAutomations';
import BackgroundPattern from "@/components/BackgroundPattern";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PlayCircle, Server, FileText, Wifi, WifiOff, AlertTriangle, Settings } from "lucide-react";
import { getLastConnectionStatus, isPreviewEnvironment, checkConnection, getAutomationServerUrl } from "@/utils/automationServerUrl";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ServerAutomation = () => {
  const [serverConnected, setServerConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [isN8NMode, setIsN8NMode] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // التحقق من حالة الاتصال بالخادم
    checkServerConnection();
    
    // التحقق مما إذا كنا في وضع n8n
    const n8nMode = localStorage.getItem('use_n8n_mode') === 'true';
    setIsN8NMode(n8nMode);
  }, []);
  
  const checkServerConnection = async () => {
    try {
      // حتى إذا كنا في بيئة المعاينة، نستخدم وضع التنفيذ الفعلي
      if (isPreviewEnvironment()) {
        // تم تعديل هذا الجزء لعدم عرض رسالة المعاينة
        // لأن isPreviewEnvironment() ترجع الآن دائمًا false
      }
      
      // التحقق من الاتصال بالخادم
      const connectionResult = await checkConnection();
      
      setServerConnected(connectionResult.isConnected);
      
      if (connectionResult.isConnected) {
        toast.success("تم الاتصال بخادم الأتمتة بنجاح", {
          duration: 3000,
        });
      } else {
        // استخدام خادم Render الافتراضي
        const serverUrl = getAutomationServerUrl();
        toast.error("تعذر الاتصال بخادم الأتمتة", {
          description: `تأكد من أن خادم الأتمتة متاح على: ${serverUrl}`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("خطأ أثناء التحقق من الاتصال:", error);
      setServerConnected(false);
      
      toast.error("تعذر الاتصال بخادم الأتمتة", {
        description: "يرجى التحقق من إعدادات الخادم والمحاولة مرة أخرى.",
        duration: 5000,
      });
    }
  };
  
  const goToServerSettings = () => {
    navigate("/server-settings");
  };
  
  const toggleN8NMode = () => {
    const newMode = !isN8NMode;
    setIsN8NMode(newMode);
    localStorage.setItem('use_n8n_mode', newMode ? 'true' : 'false');
    
    toast.success(newMode ? 
      "تم تفعيل وضع n8n. سيتم توجيه الطلبات إلى خادم n8n." : 
      "تم تعطيل وضع n8n. سيتم استخدام خادم الأتمتة العادي."
    );
  };
  
  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />
      
      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />
        
        <div className="mt-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold">
              {isN8NMode ? "الأتمتة باستخدام n8n" : "الأتمتة عبر الخادم"}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            {isN8NMode ? 
              "قم بإنشاء وإدارة سيناريوهات الأتمتة التي يتم تنفيذها عبر خادم n8n. يمكنك التعامل مع كميات كبيرة من البيانات وتحديد موقع الهدف بدقة." : 
              "قم بإنشاء وإدارة سيناريوهات الأتمتة التي يتم تنفيذها عبر خادم التحكم الآلي. يمكنك إنشاء سيناريوهات متعددة وحفظها لاستخدامها لاحقًا."
            }
          </p>
          
          <div className="mt-4 flex items-center gap-2">
            <Button 
              onClick={toggleN8NMode}
              variant={isN8NMode ? "default" : "outline"}
              className={isN8NMode ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Server className="h-4 w-4 mr-2" />
              {isN8NMode ? "وضع n8n مفعّل" : "تفعيل وضع n8n"}
            </Button>
            {isN8NMode && (
              <span className="text-xs text-green-600">
                سيتم توجيه جميع طلبات الأتمتة إلى خادم n8n
              </span>
            )}
          </div>
        </div>
        
        {!serverConnected && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تعذر الاتصال بخادم الأتمتة</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>سيتم استخدام خادم Render الرسمي. قد يستغرق الاتصال بعض الوقت إذا كان الخادم في وضع السكون.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToServerSettings}
                className="border-red-300 bg-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                إعدادات الخادم
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {isN8NMode && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Server className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-800">وضع n8n مفعّل</AlertTitle>
            <AlertDescription className="text-green-700">
              أنت الآن تستخدم خادم n8n للأتمتة. يمكنك التعامل مع كميات كبيرة من البيانات (1000-2000 عملية يوميًا) والتعامل مع مواقع متعددة.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px] mb-6">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              إنشاء أتمتة جديدة
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              الأتمتة المحفوظة
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            <AutomationController isN8NMode={isN8NMode} />
          </TabsContent>
          
          <TabsContent value="saved">
            <SavedAutomations isN8NMode={isN8NMode} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServerAutomation;
