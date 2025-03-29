
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, Shield, Key, RotateCw, Save, Trash, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";

interface ApiKeyInfo {
  keyId: number;
  keyPreview: string;
  isValid: boolean;
  callCount: number;
  recentCalls: number;
  model: string;
  failCount: number;
}

const GeminiApiKeyManager: React.FC = () => {
  const { toast } = useToast();
  const { 
    setGeminiApiKeys, 
    getApiKeysInfo, 
    setApiKeyModel, 
    resetKeyStats, 
    testGeminiConnection 
  } = useGeminiProcessing();
  
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [bulkApiKeys, setBulkApiKeys] = useState<string>('');
  const [apiKeysInfo, setApiKeysInfo] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState<number | null>(null);
  
  // تحميل المفاتيح المخزنة عند تحميل المكون
  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('geminiApiKeys');
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        if (Array.isArray(parsedKeys)) {
          setApiKeys(parsedKeys);
        }
      } else {
        // إذا لم تكن هناك مفاتيح متعددة، استخدام المفتاح الفردي
        const singleKey = localStorage.getItem('geminiApiKey');
        if (singleKey) {
          setApiKeys([singleKey]);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل مفاتيح API:', error);
    }
    
    // تحميل معلومات المفاتيح
    loadApiKeysInfo();
    
    // تحديث معلومات المفاتيح كل 10 ثوانٍ
    const intervalId = setInterval(loadApiKeysInfo, 10000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // تحميل معلومات المفاتيح
  const loadApiKeysInfo = () => {
    try {
      const info = getApiKeysInfo();
      setApiKeysInfo(info);
    } catch (error) {
      console.error('خطأ في تحميل معلومات المفاتيح:', error);
    }
  };
  
  // إضافة مفتاح جديد
  const handleAddKey = () => {
    setApiKeys(prev => [...prev, '']);
  };
  
  // تحديث مفتاح في الفهرس المحدد
  const handleUpdateKey = (index: number, value: string) => {
    const newKeys = [...apiKeys];
    newKeys[index] = value;
    setApiKeys(newKeys);
  };
  
  // حذف مفتاح
  const handleRemoveKey = (index: number) => {
    const newKeys = [...apiKeys].filter((_, i) => i !== index);
    setApiKeys(newKeys);
  };
  
  // إعادة تعيين الإحصائيات
  const handleResetStats = () => {
    resetKeyStats();
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين إحصائيات استخدام المفاتيح"
    });
    setTimeout(loadApiKeysInfo, 500);
  };
  
  // اختبار اتصال مفتاح API
  const handleTestKey = async (keyIndex: number) => {
    setIsTestingConnection(keyIndex);
    
    try {
      const apiKey = apiKeys[keyIndex];
      const model = apiKeysInfo.find(info => info.keyId === keyIndex)?.model || "gemini-1.5-pro";
      
      const result = await testGeminiConnection(apiKey, model);
      
      if (result) {
        toast({
          title: "اتصال ناجح",
          description: `مفتاح API صالح ومتصل بنجاح (${model})`,
          variant: "success"
        });
      } else {
        toast({
          title: "فشل الاتصال",
          description: "تعذر الاتصال بـ Gemini API. يرجى التحقق من المفتاح",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("خطأ في اختبار المفتاح:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء اختبار المفتاح",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(null);
    }
  };
  
  // تحديث معلومات المفاتيح يدوياً
  const handleRefreshInfo = () => {
    setIsRefreshing(true);
    try {
      loadApiKeysInfo();
      toast({
        title: "تم التحديث",
        description: "تم تحديث معلومات المفاتيح بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المعلومات",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };
  
  // حفظ المفاتيح
  const handleSaveKeys = () => {
    setIsLoading(true);
    
    try {
      // تنظيف المفاتيح وإزالة القيم الفارغة
      const cleanedKeys = apiKeys.filter(key => key.trim() !== '');
      
      if (cleanedKeys.length === 0) {
        toast({
          title: "خطأ",
          description: "يرجى إضافة مفتاح API واحد على الأقل",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // تخزين المفاتيح وتحديث حالة المكون
      localStorage.setItem('geminiApiKeys', JSON.stringify(cleanedKeys));
      
      // تحديث المفاتيح في hook
      setGeminiApiKeys(cleanedKeys);
      
      toast({
        title: "تم الحفظ",
        description: `تم حفظ ${cleanedKeys.length} مفاتيح API بنجاح`,
      });
      
      // تحديث معلومات المفاتيح
      setTimeout(loadApiKeysInfo, 1000);
    } catch (error) {
      console.error('خطأ في حفظ المفاتيح:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المفاتيح",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // معالجة المفاتيح المتعددة
  const handleProcessBulkKeys = () => {
    if (!bulkApiKeys.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفاتيح API",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // تقسيم النص إلى أسطر وتنظيفه
      const lines = bulkApiKeys
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
      
      if (lines.length === 0) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على مفاتيح صالحة",
          variant: "destructive"
        });
        return;
      }
      
      // تحديث المفاتيح
      setApiKeys(lines);
      setBulkApiKeys('');
      
      toast({
        title: "تم المعالجة",
        description: `تم استيراد ${lines.length} مفاتيح API`,
      });
    } catch (error) {
      console.error('خطأ في معالجة المفاتيح المتعددة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة المفاتيح",
        variant: "destructive"
      });
    }
  };
  
  // تعيين نموذج لمفتاح محدد
  const handleSetModel = (keyId: number, model: string) => {
    setApiKeyModel(keyId, model);
    
    // تحديث واجهة المستخدم
    setApiKeysInfo(prev => 
      prev.map(info => 
        info.keyId === keyId 
          ? { ...info, model } 
          : info
      )
    );
    
    toast({
      title: "تم التحديث",
      description: `تم تحديث نموذج المفتاح #${keyId + 1} إلى ${model}`,
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Key className="h-5 w-5 mr-2 text-primary" />
              إدارة مفاتيح Gemini API
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetStats}
                className="text-xs"
              >
                إعادة تعيين الإحصائيات
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshInfo}
                disabled={isRefreshing}
                className="text-xs"
              >
                {isRefreshing ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            أضف مفاتيح متعددة لـ Gemini API لتوزيع الطلبات وتحسين أداء النظام
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* عرض معلومات المفاتيح */}
          {apiKeysInfo.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <div className="text-sm font-medium mb-2">حالة المفاتيح:</div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-2 text-right">المفتاح</th>
                    <th className="p-2 text-right">الحالة</th>
                    <th className="p-2 text-right">النموذج</th>
                    <th className="p-2 text-right">عدد الاستخدامات</th>
                    <th className="p-2 text-right">طلبات حديثة</th>
                    <th className="p-2 text-right">اختبار</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeysInfo.map((info) => (
                    <tr key={info.keyId} className="border-b border-muted">
                      <td className="p-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="font-mono text-xs">{info.keyPreview}</span>
                          <Badge variant={info.isValid ? "default" : "destructive"} className="ml-2">
                            #{info.keyId + 1}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2">
                        {info.isValid ? (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" /> صالح
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" /> غير صالح ({info.failCount})
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <Select 
                          defaultValue={info.model} 
                          onValueChange={(value) => handleSetModel(info.keyId, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="اختر النموذج" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                            <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                            <SelectItem value="gemini-pro">gemini-pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className="font-mono">
                          {info.callCount}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={info.recentCalls >= 5 ? "destructive" : "secondary"}>
                          {info.recentCalls}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTestKey(info.keyId)}
                          disabled={isTestingConnection === info.keyId}
                          className="text-xs"
                        >
                          {isTestingConnection === info.keyId ? (
                            <RotateCw className="h-3 w-3 animate-spin" />
                          ) : (
                            "اختبار"
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* قائمة المفاتيح */}
          <div className="space-y-4">
            {apiKeys.map((key, index) => (
              <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                <Input
                  value={key}
                  onChange={(e) => handleUpdateKey(index, e.target.value)}
                  placeholder="أدخل مفتاح Gemini API"
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => handleRemoveKey(index)}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleAddKey}>
                إضافة مفتاح
              </Button>
              
              <Button 
                onClick={handleSaveKeys} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    حفظ المفاتيح
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Label htmlFor="bulkKeys" className="block mb-2">إضافة مفاتيح متعددة (كل مفتاح في سطر)</Label>
            <Textarea
              id="bulkKeys"
              value={bulkApiKeys}
              onChange={(e) => setBulkApiKeys(e.target.value)}
              placeholder="ضع مفاتيح Gemini API هنا، كل مفتاح في سطر منفصل"
              rows={5}
              className="mb-2"
            />
            <Button 
              variant="outline" 
              onClick={handleProcessBulkKeys}
            >
              معالجة المفاتيح المتعددة
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-start">
          <div className="text-sm text-muted-foreground">
            <Shield className="h-4 w-4 inline-block mr-1 text-amber-500" />
            تحذير: يتم تخزين المفاتيح في متصفحك المحلي فقط. لا تتم مشاركتها مع أي خادم خارجي.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GeminiApiKeyManager;
