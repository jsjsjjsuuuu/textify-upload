import React, { useState, useEffect } from 'react';
import { 
  getAutomationServerUrl, 
  setCustomAutomationServerUrl, 
  resetAutomationServerUrl,
  isValidServerUrl
} from '../utils/automationServerUrl';
import { AutomationService } from '../utils/automationService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const ServerSettings = () => {
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // استرجاع عنوان URL الحالي عند تحميل الصفحة
    setServerUrl(getAutomationServerUrl());
    // التحقق من حالة الخادم عند تحميل الصفحة
    checkServerStatus();
  }, []);
  
  const handleSaveUrl = () => {
    try {
      // التحقق من صحة URL
      if (!isValidServerUrl(serverUrl)) {
        toast.error('يرجى إدخال عنوان URL صحيح');
        return;
      }
      
      // حفظ URL الجديد
      setCustomAutomationServerUrl(serverUrl);
      toast.success('تم حفظ عنوان الخادم بنجاح');
      
      // إعادة التحقق من حالة الخادم بعد تغيير العنوان
      setTimeout(() => {
        checkServerStatus();
      }, 500);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ عنوان الخادم');
    }
  };
  
  const handleResetUrl = () => {
    resetAutomationServerUrl();
    const defaultUrl = getAutomationServerUrl();
    setServerUrl(defaultUrl);
    toast.success('تم إعادة تعيين عنوان الخادم إلى القيمة الافتراضية');
    
    // إعادة التحقق من حالة الخادم بعد إعادة تعيين العنوان
    setTimeout(() => {
      checkServerStatus();
    }, 500);
  };
  
  const checkServerStatus = async () => {
    setServerStatus('checking');
    setIsLoading(true);
    
    try {
      const currentUrl = getAutomationServerUrl();
      console.log("التحقق من حالة الخادم:", currentUrl);
      
      const result = await AutomationService.checkServerStatus();
      setServerStatus('online');
      setServerInfo(result);
      toast.success('الخادم متصل ويعمل بشكل صحيح');
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      setServerStatus('offline');
      setServerInfo(null);
      toast.error(`تعذر الاتصال بالخادم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
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
          {/* عرض حالة الخادم */}
          {serverStatus === 'online' && (
            <Alert variant="default" className="bg-green-50 border-green-300">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">الخادم متصل ومستجيب</AlertTitle>
              <AlertDescription className="text-green-700">
                تم التحقق من الاتصال بالخادم بنجاح. يمكنك الآن استخدام ميزات الأتمتة.
              </AlertDescription>
            </Alert>
          )}
          
          {serverStatus === 'offline' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>تعذر الاتصال بالخادم</AlertTitle>
              <AlertDescription>
                تأكد من أن خادم الأتمتة يعمل وأن العنوان المدخل صحيح.
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkServerStatus}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    إعادة المحاولة
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">عنوان URL الحالي:</h3>
            <div className="p-3 bg-muted rounded-md text-sm font-mono break-all">
              {getAutomationServerUrl()}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">تعيين عنوان URL مخصص:</h3>
            <div className="flex space-x-2 flex-row-reverse">
              <Input
                dir="ltr"
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="أدخل عنوان URL للخادم"
                className="flex-1"
              />
              <Button 
                variant="secondary" 
                onClick={checkServerStatus}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    جارٍ الفحص...
                  </>
                ) : (
                  'فحص الاتصال'
                )}
              </Button>
            </div>
          </div>
          
          {/* عرض معلومات الخادم إذا كان متصلاً */}
          {serverStatus === 'online' && serverInfo && (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
              <h3 className="text-lg font-medium">معلومات الخادم:</h3>
              <div className="space-y-1 text-sm">
                <div><strong>الحالة:</strong> {serverInfo.status}</div>
                <div><strong>الرسالة:</strong> {serverInfo.message}</div>
                <div><strong>الوقت:</strong> {new Date(serverInfo.time).toLocaleString()}</div>
                {serverInfo.systemInfo && (
                  <>
                    <div><strong>إصدار Node.js:</strong> {serverInfo.systemInfo.nodeVersion}</div>
                    <div><strong>المنصة:</strong> {serverInfo.systemInfo.platform}</div>
                    <div><strong>وقت التشغيل:</strong> {Math.floor(serverInfo.systemInfo.uptime / 60)} دقيقة</div>
                    <div><strong>البيئة:</strong> {serverInfo.systemInfo.env}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between flex-row-reverse">
          <Button onClick={handleSaveUrl} disabled={isLoading}>حفظ الإعدادات</Button>
          <Button variant="outline" onClick={handleResetUrl} disabled={isLoading}>
            إعادة التعيين
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 max-w-2xl mx-auto bg-muted p-4 rounded-md">
        <h3 className="font-semibold mb-2">تلميحات للتكوين:</h3>
        <ul className="space-y-2 list-disc list-inside text-sm">
          <li>للاتصال بخادم محلي، استخدم: <code className="text-xs bg-background px-1 py-0.5 rounded">http://localhost:10000</code></li>
          <li>للاتصال بخادم Render، استخدم: <code className="text-xs bg-background px-1 py-0.5 rounded">https://textify-upload.onrender.com</code></li>
          <li>للتأكد من عمل خادم الأتمتة المحلي، قم بتشغيله باستخدام: <code className="text-xs bg-background px-1 py-0.5 rounded">node src/server/server.js</code></li>
          <li>إذا كان الخادم المحلي يعمل بالفعل، تأكد من أنه يستمع على المنفذ 10000</li>
        </ul>
      </div>
    </div>
  );
};

export default ServerSettings;
