
import React from "react";
import ServerUrlConfigurator from "./ServerUrlConfigurator";
import ConnectionStatus from "./ConnectionStatus";
import ServerInfoDisplay from "./ServerInfoDisplay";
import AutoReconnectToggle from "./AutoReconnectToggle";
import ConfigurationTips from "./ConfigurationTips";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="container mx-auto py-10" dir="rtl">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">إعدادات خادم الأتمتة</CardTitle>
          <CardDescription>
            تكوين عنوان URL الخاص بخادم الأتمتة للتطبيق
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <AutoReconnectToggle 
            autoReconnect={autoReconnect}
            onAutoReconnectChange={onAutoReconnectChange}
          />
        
          <ConnectionStatus
            status={serverStatus}
            isLoading={isLoading}
            reconnectStatus={reconnectStatus}
            autoReconnect={autoReconnect}
            onCheckStatus={onCheckStatus}
            onEnableAutoReconnect={onEnableAutoReconnect}
          />
          
          <ServerUrlConfigurator
            serverUrl={serverUrl}
            onServerUrlChange={onServerUrlChange}
            onCheckStatus={onCheckStatus}
            isLoading={isLoading}
          />
          
          <ServerInfoDisplay
            serverInfo={serverInfo}
            serverStatus={serverStatus}
          />
        </CardContent>
        
        <CardFooter className="flex justify-between flex-row-reverse">
          <Button onClick={onSaveUrl} disabled={isLoading}>حفظ الإعدادات</Button>
          <Button variant="outline" onClick={onResetUrl} disabled={isLoading}>
            إعادة التعيين
          </Button>
        </CardFooter>
      </Card>
      
      <ConfigurationTips />
    </div>
  );
};

export default ServerSettingsComponent;
