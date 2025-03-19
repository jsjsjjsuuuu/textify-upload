
import React from 'react';
import { toast } from 'sonner';
import CloudServerCreator from '@/components/CloudServerCreator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServerSettingsComponent from '@/components/ServerSettings';
import { useNavigate } from 'react-router-dom';

const CloudServer = () => {
  const navigate = useNavigate();
  
  const handleServerCreated = (serverUrl: string) => {
    toast.success('تم إنشاء الخادم السحابي بنجاح');
    console.log('تم إنشاء الخادم السحابي:', serverUrl);
  };
  
  return (
    <div className="container mx-auto py-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-6 text-center">إدارة الخوادم السحابية</h1>
      
      <Tabs defaultValue="creator" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="creator">إنشاء خادم جديد</TabsTrigger>
          <TabsTrigger value="settings">إعدادات الخادم</TabsTrigger>
        </TabsList>
        
        <TabsContent value="creator" className="p-4">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <p className="text-muted-foreground mb-6 text-center">
              قم بإنشاء خادم سحابي جديد عند زيارة الموقع للتمكن من استخدام جميع ميزات التطبيق.
            </p>
            
            <CloudServerCreator onServerCreated={handleServerCreated} />
            
            <div className="mt-8 p-4 bg-muted rounded-lg text-sm">
              <h3 className="font-medium mb-2">كيف يعمل الخادم السحابي؟</h3>
              <p className="mb-2">
                عند زيارة الموقع، يقوم النظام تلقائيًا بإنشاء خادم سحابي مخصص لاستخدامك.
                يمكنك تخصيص إعدادات الخادم أو إيقاف الإنشاء التلقائي من قسم الإعدادات.
              </p>
              <p>
                يتم استخدام الخادم لتشغيل عمليات المعالجة المكثفة مثل الأتمتة والتعرف على النصوص،
                مما يوفر أداءً أفضل وموثوقية أعلى.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <ServerSettingsComponent
            serverUrl=""
            serverStatus="idle"
            serverInfo={null}
            isLoading={false}
            autoReconnect={true}
            reconnectStatus={{
              active: false,
              lastAttempt: 0,
              attempts: 0
            }}
            onServerUrlChange={() => {}}
            onCheckStatus={() => {}}
            onSaveUrl={() => {}}
            onResetUrl={() => {}}
            onAutoReconnectChange={() => {}}
            onEnableAutoReconnect={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CloudServer;
