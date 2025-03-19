
import React, { useState, useEffect } from 'react';
import AutomationController from '@/components/ServerAutomation/AutomationController';
import SavedAutomations from '@/components/ServerAutomation/SavedAutomations';
import BackgroundPattern from "@/components/BackgroundPattern";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PlayCircle, Server, FileText, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { getLastConnectionStatus } from "@/utils/automationServerUrl";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ServerAutomation = () => {
  const [serverConnected, setServerConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const navigate = useNavigate();
  
  useEffect(() => {
    // التحقق من حالة الاتصال بالخادم
    const connectionStatus = getLastConnectionStatus();
    setServerConnected(connectionStatus.isConnected);
  }, []);
  
  const goToServerSettings = () => {
    navigate("/server-settings");
  };
  
  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />
      
      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />
        
        <div className="mt-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold">الأتمتة عبر الخادم</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            قم بإنشاء وإدارة سيناريوهات الأتمتة التي يتم تنفيذها عبر خادم التحكم الآلي. 
            يمكنك إنشاء سيناريوهات متعددة وحفظها لاستخدامها لاحقًا.
          </p>
        </div>
        
        {!serverConnected && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تعذر الاتصال بخادم الأتمتة</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>لن تتمكن من تنفيذ سيناريوهات الأتمتة حتى يتم الاتصال بالخادم.</span>
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
            <AutomationController />
          </TabsContent>
          
          <TabsContent value="saved">
            <SavedAutomations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServerAutomation;
