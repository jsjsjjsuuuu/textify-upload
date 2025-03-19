
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Cloud, Server, ExternalLink, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAutomationServerUrl, checkConnection } from '@/utils/automationServerUrl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CloudServerCreatorProps {
  onServerCreated?: (serverUrl: string) => void;
}

const CloudServerCreator: React.FC<CloudServerCreatorProps> = ({ onServerCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [autoCreateServer, setAutoCreateServer] = useState(() => {
    return localStorage.getItem('autoCreateCloudServer') === 'true';
  });
  const [selectedProvider, setSelectedProvider] = useState(() => {
    return localStorage.getItem('cloudServerProvider') || 'render';
  });
  const [serverStatus, setServerStatus] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle');
  const [showSettings, setShowSettings] = useState(false);

  // استرجاع عنوان الخادم المخزن عند تحميل المكون
  useEffect(() => {
    const savedServerUrl = localStorage.getItem('cloudServerUrl');
    if (savedServerUrl) {
      setServerUrl(savedServerUrl);
      checkSavedServerStatus(savedServerUrl);
    } else {
      // استخدام العنوان الافتراضي
      setServerUrl(getAutomationServerUrl());
    }
  }, []);

  // التحقق من حالة الخادم المحفوظ
  const checkSavedServerStatus = async (url: string) => {
    try {
      setServerStatus('creating');
      const result = await checkConnection();
      
      if (result.isConnected) {
        setServerStatus('ready');
        onServerCreated?.(url);
        toast.success('تم الاتصال بالخادم السحابي بنجاح');
      } else {
        setServerStatus('error');
        if (autoCreateServer) {
          // محاولة إنشاء خادم جديد إذا كان التلقائي مفعل
          createCloudServer();
        }
      }
    } catch (error) {
      setServerStatus('error');
      console.error('خطأ في التحقق من حالة الخادم:', error);
    }
  };

  // حفظ الإعدادات في التخزين المحلي
  useEffect(() => {
    localStorage.setItem('autoCreateCloudServer', autoCreateServer.toString());
    localStorage.setItem('cloudServerProvider', selectedProvider);
    if (serverUrl) {
      localStorage.setItem('cloudServerUrl', serverUrl);
    }
  }, [autoCreateServer, selectedProvider, serverUrl]);

  // إنشاء خادم سحابي جديد
  const createCloudServer = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    setServerStatus('creating');
    
    try {
      toast.info('جاري إنشاء خادم سحابي جديد، يرجى الانتظار...');
      
      // محاكاة إنشاء الخادم (في التطبيق الحقيقي، سيتم استبدال هذا بطلب API فعلي)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newServerUrl = selectedProvider === 'render' 
        ? 'https://textify-upload.onrender.com' 
        : 'https://textify-automation.railway.app';
      
      setServerUrl(newServerUrl);
      localStorage.setItem('cloudServerUrl', newServerUrl);
      
      // التحقق من اتصال الخادم الجديد
      const connectionResult = await checkConnection();
      
      if (connectionResult.isConnected) {
        setServerStatus('ready');
        toast.success('تم إنشاء الخادم السحابي بنجاح');
        onServerCreated?.(newServerUrl);
      } else {
        setServerStatus('error');
        toast.error(`فشل الاتصال بالخادم السحابي: ${connectionResult.message}`);
      }
    } catch (error) {
      setServerStatus('error');
      toast.error('حدث خطأ أثناء إنشاء الخادم السحابي');
      console.error('خطأ إنشاء الخادم:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // عندما يقوم المستخدم بزيارة الموقع، نقوم بإنشاء خادم تلقائي إذا كان مفعلاً
  useEffect(() => {
    if (autoCreateServer && serverStatus === 'idle') {
      createCloudServer();
    }
  }, [autoCreateServer, serverStatus]);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">الخادم السحابي</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSettings}
            title="إعدادات الخادم"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <CardDescription>
          إدارة الخادم السحابي لتطبيقك
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {serverStatus === 'ready' ? (
          <Alert className="bg-green-50 border-green-300">
            <Server className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">الخادم جاهز</AlertTitle>
            <AlertDescription className="text-green-700">
              الخادم السحابي يعمل ومتصل. يمكنك الآن استخدام جميع ميزات التطبيق.
            </AlertDescription>
          </Alert>
        ) : serverStatus === 'error' ? (
          <Alert variant="destructive">
            <Server className="h-4 w-4" />
            <AlertTitle>الخادم غير متصل</AlertTitle>
            <AlertDescription>
              تعذر الاتصال بالخادم السحابي. يمكنك إنشاء خادم جديد أو التحقق من الإعدادات.
            </AlertDescription>
          </Alert>
        ) : serverStatus === 'creating' ? (
          <Alert className="bg-blue-50 border-blue-300">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertTitle className="text-blue-800">جاري التحضير</AlertTitle>
            <AlertDescription className="text-blue-700">
              جاري إنشاء الخادم السحابي. قد تستغرق هذه العملية بضع دقائق...
            </AlertDescription>
          </Alert>
        ) : null}

        {showSettings && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-md">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">إعدادات الخادم السحابي</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoCreate" className="text-sm">
                  إنشاء خادم تلقائي عند زيارة الموقع
                </Label>
                <Switch
                  id="autoCreate"
                  checked={autoCreateServer}
                  onCheckedChange={setAutoCreateServer}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="serverUrl" className="text-sm">
                  عنوان الخادم
                </Label>
                <Input
                  id="serverUrl"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="أدخل عنوان URL للخادم"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="provider" className="text-sm">
                  مزود الخدمة السحابية
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant={selectedProvider === 'render' ? 'default' : 'outline'}
                    onClick={() => setSelectedProvider('render')}
                    className="justify-start"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    Render
                  </Button>
                  <Button
                    type="button"
                    variant={selectedProvider === 'railway' ? 'default' : 'outline'}
                    onClick={() => setSelectedProvider('railway')}
                    className="justify-start"
                  >
                    <Server className="h-4 w-4 mr-2" />
                    Railway
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(serverUrl, '_blank')}
          disabled={!serverUrl || serverStatus === 'creating'}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          فتح الخادم
        </Button>
        
        <Button 
          onClick={createCloudServer} 
          disabled={isCreating}
          className="relative"
        >
          {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Cloud className="h-4 w-4 mr-2" />
          {serverStatus === 'error' ? 'إعادة إنشاء الخادم' : 'إنشاء خادم جديد'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CloudServerCreator;
