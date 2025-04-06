import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { CheckIcon, KeyIcon, Shield } from "lucide-react";
import { toast } from "./ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "./ui/dialog";
import { testConnection } from "@/lib/gemini"; // تغيير من testGeminiConnection إلى testConnection
import { 
  addApiKey, 
  getApiKeyStats, 
  resetAllApiKeys, 
  DEFAULT_GEMINI_API_KEY,
  isCustomKeyActive
} from "@/lib/gemini";

const GeminiApiManager = () => {
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [apiKeyStats, setApiKeyStats] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isCustomKeyDialogOpen, setIsCustomKeyDialogOpen] = useState<boolean>(false);
  const [useCustomKey, setUseCustomKey] = useState<boolean>(localStorage.getItem('use_custom_gemini_api_key') === 'true');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  
  useEffect(() => {
    const storedKey = localStorage.getItem('custom_gemini_api_key');
    if (storedKey) {
      setCustomApiKey(storedKey);
    }
    
    // تحميل حالة استخدام المفتاح المخصص من الذاكرة المحلية
    const storedUseCustomKey = localStorage.getItem('use_custom_gemini_api_key') === 'true';
    setUseCustomKey(storedUseCustomKey);
    
    fetchApiKeyStats();
  }, []);

  const fetchApiKeyStats = async () => {
    const stats = getApiKeyStats();
    setApiKeyStats(stats);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomApiKey(e.target.value);
  };

  const handleTestApiKey = async () => {
    setIsTesting(true);
    setIsApiKeyValid(false);
    
    try {
      const result = await testConnection(customApiKey);
      if (result.success) {
        setIsApiKeyValid(true);
        toast({
          title: "تم التحقق من المفتاح",
          description: "مفتاح Gemini API صالح",
        });
      } else {
        setIsApiKeyValid(false);
        toast({
          title: "خطأ في التحقق",
          description: `فشل التحقق من مفتاح Gemini API: ${result.message}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setIsApiKeyValid(false);
      toast({
        title: "خطأ",
        description: `حدث خطأ أثناء اختبار المفتاح: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveApiKey = () => {
    if (isApiKeyValid) {
      localStorage.setItem('custom_gemini_api_key', customApiKey);
      addApiKey(customApiKey);
      setUseCustomKey(true);
      localStorage.setItem('use_custom_gemini_api_key', 'true');
      toast({
        title: "تم الحفظ",
        description: "تم حفظ مفتاح Gemini API المخصص",
      });
      setIsCustomKeyDialogOpen(false);
      fetchApiKeyStats();
    } else {
      toast({
        title: "خطأ",
        description: "يرجى التأكد من أن المفتاح صالح قبل الحفظ",
        variant: "destructive",
      });
    }
  };

  const handleResetApiKeys = () => {
    resetAllApiKeys();
    setUseCustomKey(false);
    localStorage.removeItem('use_custom_gemini_api_key');
    localStorage.removeItem('custom_gemini_api_key');
    setCustomApiKey("");
    setIsApiKeyValid(false);
    fetchApiKeyStats();
    toast({
      title: "تم إعادة التعيين",
      description: "تمت إعادة تعيين جميع مفاتيح Gemini API إلى الوضع الافتراضي",
    });
  };
  
  const handleToggleUseCustomKey = () => {
    const newUseCustomKey = !useCustomKey;
    setUseCustomKey(newUseCustomKey);
    localStorage.setItem('use_custom_gemini_api_key', newUseCustomKey.toString());
    
    if (newUseCustomKey) {
      if (!customApiKey) {
        setIsCustomKeyDialogOpen(true);
        toast({
          title: "تنبيه",
          description: "الرجاء إدخال مفتاح API مخصص",
        });
      } else {
        toast({
          title: "تم التفعيل",
          description: "تم تفعيل استخدام مفتاح Gemini API المخصص",
        });
      }
    } else {
      toast({
        title: "تم التعطيل",
        description: "تم تعطيل استخدام مفتاح Gemini API المخصص",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">إدارة مفتاح Gemini API</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline" size="sm" onClick={fetchApiKeyStats}>
                تحديث الإحصائيات
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>تحديث إحصائيات مفاتيح API</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        يمكنك استخدام مفتاح API مخصص أو الاعتماد على المفتاح الافتراضي.
      </p>
      
      <div className="mt-4 flex items-center justify-between">
        <Label htmlFor="use-custom-key" className="mr-2">
          استخدام مفتاح API مخصص:
        </Label>
        <Button 
          variant="secondary" 
          onClick={handleToggleUseCustomKey}
        >
          {useCustomKey ? "إيقاف" : "تفعيل"}
        </Button>
      </div>

      {apiKeyStats && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold">إحصائيات المفاتيح:</h4>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Badge variant="secondary">
                <KeyIcon className="h-4 w-4 mr-2" />
                المجموع: {apiKeyStats.total}
              </Badge>
            </div>
            <div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <CheckIcon className="h-4 w-4 mr-2" />
                نشط: {apiKeyStats.active}
              </Badge>
            </div>
            <div>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                <Shield className="h-4 w-4 mr-2" />
                محظور: {apiKeyStats.blocked}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isCustomKeyDialogOpen} onOpenChange={setIsCustomKeyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إعداد مفتاح API مخصص</DialogTitle>
            <DialogDescription>
              أدخل مفتاح Gemini API المخصص الخاص بك.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right">
                مفتاح API
              </Label>
              <Input 
                id="api-key" 
                value={customApiKey}
                onChange={handleApiKeyChange}
                className="col-span-3" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleTestApiKey} disabled={isTesting}>
              {isTesting ? "جاري التحقق..." : "التحقق من المفتاح"}
            </Button>
            <Button type="button" onClick={handleSaveApiKey} disabled={!isApiKeyValid}>
              حفظ المفتاح
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4">
        <Button variant="destructive" onClick={handleResetApiKeys}>
          إعادة تعيين المفاتيح
        </Button>
      </div>
    </div>
  );
};

export default GeminiApiManager;
