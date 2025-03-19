
import React from "react";
import ServerUrlConfigurator from "./ServerUrlConfigurator";
import ConnectionStatus from "./ConnectionStatus";
import ServerInfoDisplay from "./ServerInfoDisplay";
import AutoReconnectToggle from "./AutoReconnectToggle";
import ConfigurationTips from "./ConfigurationTips";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Server, RefreshCw } from "lucide-react";

interface ServerSettingsComponentProps {
  serverUrl: string;
  serverStatus: 'idle' | 'checking' | 'online' | 'offline';
  serverInfo: any;
  isLoading: boolean;
  autoReconnect: boolean;
  reconnectStatus: {
    active: boolean;
    lastAttempt: number;
    attempts: number;
  };
  onServerUrlChange: (url: string) => void;
  onCheckStatus: () => void;
  onSaveUrl: () => void;
  onResetUrl: () => void;
  onAutoReconnectChange: (checked: boolean) => void;
  onEnableAutoReconnect: () => void;
}

const ServerSettingsComponent: React.FC<ServerSettingsComponentProps> = ({
  serverUrl,
  serverStatus,
  serverInfo,
  isLoading,
  autoReconnect,
  reconnectStatus,
  onServerUrlChange,
  onCheckStatus,
  onSaveUrl,
  onResetUrl,
  onAutoReconnectChange,
  onEnableAutoReconnect
}) => {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:py-10" dir="rtl">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Server className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">إعدادات خادم الأتمتة</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          قم بتكوين عنوان URL الخاص بخادم الأتمتة وضبط إعدادات الاتصال للحصول على أفضل أداء
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-6">
          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-3 bg-slate-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                حالة الاتصال بالخادم
              </CardTitle>
              <CardDescription>
                حالة الاتصال الحالية وخيارات إعادة الاتصال
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-6">
              <ConnectionStatus
                status={serverStatus}
                isLoading={isLoading}
                reconnectStatus={reconnectStatus}
                autoReconnect={autoReconnect}
                onCheckStatus={onCheckStatus}
                onEnableAutoReconnect={onEnableAutoReconnect}
              />
              
              <AutoReconnectToggle 
                autoReconnect={autoReconnect}
                onAutoReconnectChange={onAutoReconnectChange}
              />
              
              <ServerInfoDisplay
                serverInfo={serverInfo}
                serverStatus={serverStatus}
              />
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-3 bg-slate-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <Server className="h-5 w-5 text-purple-600" />
                إعدادات عنوان الخادم
              </CardTitle>
              <CardDescription>
                قم بتعيين وإدارة عنوان URL الخاص بخادم الأتمتة
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-6">
              <ServerUrlConfigurator
                serverUrl={serverUrl}
                onServerUrlChange={onServerUrlChange}
                onCheckStatus={onCheckStatus}
                isLoading={isLoading}
              />
            </CardContent>
            
            <CardFooter className="flex justify-between flex-row-reverse bg-slate-50 border-t">
              <Button 
                onClick={onSaveUrl} 
                disabled={isLoading} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                حفظ الإعدادات
              </Button>
              <Button 
                variant="outline" 
                onClick={onResetUrl} 
                disabled={isLoading}
              >
                إعادة التعيين
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <div className="sticky top-4">
            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-3 bg-slate-50">
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  نصائح ومعلومات
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ConfigurationTips />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerSettingsComponent;
