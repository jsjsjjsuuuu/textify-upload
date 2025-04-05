
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, RefreshCw, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { 
  addApiKey, 
  getApiKeyStats, 
  resetAllApiKeys, 
  isCustomKeyActive,
  testGeminiConnection
} from '@/lib/geminiService';
import { toast } from 'sonner';

const GeminiApiManager = () => {
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false);
  const [keyStats, setKeyStats] = useState({ total: 0, active: 0, blocked: 0, rateLimited: 0 });
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [isValidKey, setIsValidKey] = useState<boolean | null>(null);
  const [savedApiKey, setSavedApiKey] = useState<string>('');
  
  // عند تحميل المكون، تحقق من حالة المفاتيح
  useEffect(() => {
    // تحميل المفتاح المخصص من التخزين المحلي إذا كان موجوداً
    const storedKey = localStorage.getItem('custom_gemini_api_key') || '';
    if (storedKey) {
      setCustomApiKey(storedKey);
      setSavedApiKey(storedKey);
    }
    
    // التحقق من تفضيل المستخدم لاستخدام المفتاح المخصص
    const useCustom = localStorage.getItem('use_custom_gemini_api_key') === 'true';
    setUseCustomKey(useCustom);
    
    // تحديث إحصائيات المفاتيح
    updateStats();
  }, []);
  
  // تحديث إحصائيات المفاتيح
  const updateStats = () => {
    const stats = getApiKeyStats();
    setKeyStats(stats);
  };
  
  // حفظ المفتاح المخصص
  const handleSaveKey = async () => {
    if (!customApiKey || customApiKey.length < 10) {
      toast.error('يرجى إدخال مفتاح API صالح');
      return;
    }
    
    // حفظ المفتاح في التخزين المحلي
    localStorage.setItem('custom_gemini_api_key', customApiKey);
    setSavedApiKey(customApiKey);
    
    // اختبار اتصال المفتاح
    setIsTestingConnection(true);
    
    try {
      const result = await testGeminiConnection(customApiKey);
      
      if (result.success) {
        setIsValidKey(true);
        toast.success('تم حفظ المفتاح واختباره بنجاح');
      } else {
        setIsValidKey(false);
        toast.error(`فشل اختبار المفتاح: ${result.message}`);
      }
    } catch (error) {
      setIsValidKey(false);
      toast.error('حدث خطأ أثناء اختبار المفتاح');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  // تغيير استخدام المفتاح المخصص
  const handleUseCustomKeyToggle = (checked: boolean) => {
    // التحقق من وجود مفتاح صالح قبل تمكين الخيار
    if (checked && (!savedApiKey || savedApiKey.length < 10)) {
      toast.error('يرجى إدخال مفتاح API صالح وحفظه أولاً قبل تفعيله');
      return;
    }
    
    // تحديث الحالة وحفظها في التخزين المحلي
    setUseCustomKey(checked);
    localStorage.setItem('use_custom_gemini_api_key', checked.toString());
    
    // تحديث حالة استخدام المفتاح في مدير المفاتيح
    if (checked) {
      addApiKey(savedApiKey);
      toast.success('تم تفعيل استخدام المفتاح المخصص');
    } else {
      addApiKey('default');
      toast.success('تم تفعيل استخدام المفتاح الافتراضي');
    }
    
    // تحديث الإحصائيات بعد التبديل
    updateStats();
  };
  
  // إعادة تعيين المفاتيح
  const handleResetKeys = () => {
    resetAllApiKeys();
    updateStats();
    toast.success('تم إعادة تعيين جميع المفاتيح');
  };
  
  return (
    <Card className="bg-white dark:bg-gray-800/50 mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-medium">إعدادات Gemini API</h3>
          
          <div className="space-y-2 mb-2">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label htmlFor="custom-api-key">مفتاح Gemini API الخاص بك</Label>
                <p className="text-sm text-muted-foreground">
                  أضف مفتاحك الخاص إذا وصلت لحد الاستخدام
                </p>
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center"
              >
                الحصول على مفتاح <ExternalLink className="h-3 w-3 mr-1" />
              </a>
            </div>
            
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Input
                id="custom-api-key"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="أضف مفتاح API الخاص بك"
                type="password"
                className="flex-grow"
              />
              <Button 
                onClick={handleSaveKey} 
                variant="outline"
                disabled={isTestingConnection}
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    جاري الاختبار
                  </>
                ) : 'حفظ'}
              </Button>
            </div>
            
            {isValidKey !== null && (
              <div className={`text-sm mt-1 flex items-center ${isValidKey ? 'text-green-500' : 'text-red-500'}`}>
                {isValidKey ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    المفتاح صالح وتم اختباره بنجاح
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    المفتاح غير صالح أو الاتصال فشل
                  </>
                )}
              </div>
            )}
            
            {savedApiKey && (
              <div className="mt-3 flex items-center justify-between space-x-2 rtl:space-x-reverse">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch
                    id="use-custom-key"
                    checked={useCustomKey}
                    onCheckedChange={handleUseCustomKeyToggle}
                  />
                  <Label htmlFor="use-custom-key" className="cursor-pointer">استخدام مفتاحي الخاص</Label>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleResetKeys}
                >
                  <RefreshCw className="h-3 w-3 ml-1" />
                  إعادة تعيين
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/40 rounded p-2 text-center">
              <div className="text-muted-foreground">المفاتيح النشطة</div>
              <div className={`font-medium ${keyStats.active === 0 ? 'text-red-500' : 'text-green-500'}`}>
                {keyStats.active}/{keyStats.total}
              </div>
            </div>
            
            <div className="bg-muted/40 rounded p-2 text-center">
              <div className="text-muted-foreground">المفاتيح المحظورة</div>
              <div className={`font-medium ${keyStats.blocked > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {keyStats.blocked}/{keyStats.total}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiApiManager;
