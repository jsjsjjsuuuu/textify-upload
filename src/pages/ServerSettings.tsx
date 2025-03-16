
import React, { useState, useEffect } from 'react';
import { 
  getAutomationServerUrl, 
  setCustomAutomationServerUrl, 
  resetAutomationServerUrl 
} from '../utils/automationServerUrl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const ServerSettings = () => {
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  
  useEffect(() => {
    // استرجاع عنوان URL الحالي عند تحميل الصفحة
    setServerUrl(getAutomationServerUrl());
  }, []);
  
  const handleSaveUrl = () => {
    try {
      // التحقق من صحة URL
      new URL(serverUrl);
      
      // حفظ URL الجديد
      setCustomAutomationServerUrl(serverUrl);
      toast.success('تم حفظ عنوان الخادم بنجاح');
    } catch (error) {
      toast.error('يرجى إدخال عنوان URL صحيح');
    }
  };
  
  const handleResetUrl = () => {
    resetAutomationServerUrl();
    setServerUrl(getAutomationServerUrl());
    toast.success('تم إعادة تعيين عنوان الخادم إلى القيمة الافتراضية');
  };
  
  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setServerStatus('online');
        const data = await response.json();
        toast.success(`الخادم متصل: ${data.message || 'خادم الأتمتة يعمل'}`);
      } else {
        setServerStatus('offline');
        toast.error('الخادم غير متصل');
      }
    } catch (error) {
      setServerStatus('offline');
      toast.error('فشل الاتصال بالخادم');
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
                disabled={serverStatus === 'checking'}
              >
                {serverStatus === 'checking' ? 'جارٍ الفحص...' : 'فحص الاتصال'}
              </Button>
            </div>
            
            {serverStatus === 'online' && (
              <div className="p-2 bg-green-100 text-green-800 rounded-md text-sm mt-2">
                ✓ الخادم متصل ومستجيب
              </div>
            )}
            
            {serverStatus === 'offline' && (
              <div className="p-2 bg-red-100 text-red-800 rounded-md text-sm mt-2">
                ✗ تعذر الاتصال بالخادم
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between flex-row-reverse">
          <Button onClick={handleSaveUrl}>حفظ الإعدادات</Button>
          <Button variant="outline" onClick={handleResetUrl}>
            إعادة التعيين
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 max-w-2xl mx-auto bg-muted p-4 rounded-md">
        <h3 className="font-semibold mb-2">تلميحات للتكوين:</h3>
        <ul className="space-y-2 list-disc list-inside text-sm">
          <li>للاتصال بخادم محلي، استخدم: <code className="text-xs bg-background px-1 py-0.5 rounded">http://localhost:3001</code></li>
          <li>للاتصال بخادم Render، استخدم: <code className="text-xs bg-background px-1 py-0.5 rounded">https://textify-upload.onrender.com</code></li>
          <li>تأكد من أن الخادم يستمع على المنفذ المحدد</li>
        </ul>
      </div>
    </div>
  );
};

export default ServerSettings;
