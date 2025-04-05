
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useGeminiProcessing } from '@/hooks/useGeminiProcessing';
import { InfoCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { getCurrentApiKey, getApiKeyStats } from '@/lib/gemini';

const GeminiApiManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const { addNewApiKey, getApiStats } = useGeminiProcessing();
  const stats = getApiStats();
  
  // التحقق من وجود مفتاح مخزن
  useEffect(() => {
    // التحقق مما إذا كان هناك مفتاح مخزن في localStorage
    const storedKey = localStorage.getItem('custom_gemini_api_key');
    const storedUseCustom = localStorage.getItem('use_custom_gemini_api_key');
    
    if (storedKey) {
      // إظهار بديل للمفتاح المخزن (لأغراض أمنية)
      setApiKey('●●●●●●●●●●●●●●●●●●●●');
    }
    
    if (storedUseCustom === 'true') {
      setUseCustomKey(true);
    }
  }, []);

  // وظيفة لإرسال المفتاح
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim() || apiKey === '●●●●●●●●●●●●●●●●●●●●') {
      toast.error("خطأ", {
        description: "يرجى إدخال مفتاح API صالح"
      });
      return;
    }
    
    const success = addNewApiKey(apiKey);
    if (success) {
      // تخزين المفتاح في localStorage
      localStorage.setItem('custom_gemini_api_key', apiKey);
      localStorage.setItem('use_custom_gemini_api_key', 'true');
      
      // إعادة تعيين حقل الإدخال وتحديث الحالة
      setApiKey('●●●●●●●●●●●●●●●●●●●●');
      setUseCustomKey(true);
      
      toast.success("تم بنجاح", {
        description: "تم حفظ مفتاح API الخاص بك وتفعيله"
      });
    }
  };
  
  // وظيفة لتبديل استخدام المفتاح المخصص
  const toggleUseCustomKey = (checked: boolean) => {
    setUseCustomKey(checked);
    localStorage.setItem('use_custom_gemini_api_key', checked ? 'true' : 'false');
    
    if (checked) {
      const storedKey = localStorage.getItem('custom_gemini_api_key');
      if (storedKey) {
        // تفعيل المفتاح المخزن
        addNewApiKey(storedKey);
        toast.success("تم التفعيل", {
          description: "تم تفعيل مفتاح API الخاص بك"
        });
      } else {
        toast.warning("تنبيه", {
          description: "لم يتم العثور على مفتاح مخزن. يرجى إضافة مفتاح جديد."
        });
        setUseCustomKey(false);
        localStorage.setItem('use_custom_gemini_api_key', 'false');
      }
    } else {
      // العودة إلى المفتاح الافتراضي
      addNewApiKey('default');
      toast.success("تم إلغاء التفعيل", {
        description: "تم العودة إلى استخدام مفتاح API الافتراضي"
      });
    }
  };
  
  // وظيفة لمسح المفتاح المخزن
  const clearStoredKey = () => {
    localStorage.removeItem('custom_gemini_api_key');
    localStorage.setItem('use_custom_gemini_api_key', 'false');
    setApiKey('');
    setUseCustomKey(false);
    addNewApiKey('default');
    
    toast.success("تم المسح", {
      description: "تم مسح مفتاح API المخزن والعودة إلى المفتاح الافتراضي"
    });
  };
  
  // الحصول على معلومات المفتاح الحالي
  const currentApiKey = getCurrentApiKey();
  const isUsingDefault = currentApiKey.includes('AIzaSy');

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">إعدادات مفتاح Gemini API</CardTitle>
        <CardDescription>
          أضف مفتاح API خاص بك للحصول على أداء أفضل في معالجة الصور
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            id="use-custom-key"
            checked={useCustomKey}
            onCheckedChange={toggleUseCustomKey}
          />
          <Label htmlFor="use-custom-key">استخدام مفتاح API الخاص بي</Label>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">مفتاح Gemini API الخاص بك</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="أدخل مفتاح API الخاص بك هنا..."
                className="flex-1"
                disabled={!useCustomKey}
              />
              <Button type="submit" disabled={!useCustomKey}>
                حفظ
              </Button>
            </div>
            {useCustomKey && apiKey === '●●●●●●●●●●●●●●●●●●●●' && (
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={clearStoredKey}>
                  مسح المفتاح المخزن
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              للحصول على مفتاح Gemini API يرجى زيارة{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span>المفتاح المستخدم حالياً:</span>
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                {isUsingDefault ? 'المفتاح الافتراضي' : 'مفتاح مخصص'}
              </span>
            </div>
            
            {stats && (
              <div className="text-sm text-muted-foreground space-y-1 border-t pt-2 mt-2">
                <p>حالة المفاتيح: {stats.active}/{stats.total} نشطة</p>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default GeminiApiManager;
