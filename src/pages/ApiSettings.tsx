
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, Key, Lock, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { authenticateWithExternalApi } from "@/lib/apiService";
import BackgroundPattern from "@/components/BackgroundPattern";

const ApiSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isAutoSubmit, setIsAutoSubmit] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleVerifyApiKey = async () => {
    if (!apiKey) {
      toast({
        title: "حقل مطلوب",
        description: "يرجى إدخال مفتاح API الخاص بك",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const result = await authenticateWithExternalApi(apiKey);

      if (result.success) {
        setIsAuthenticated(true);
        toast({
          title: "تم التحقق بنجاح",
          description: "تم التحقق من مفتاح API الخاص بك بنجاح",
        });
      } else {
        setIsAuthenticated(false);
        toast({
          title: "فشل التحقق",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsAuthenticated(false);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "تم النسخ",
      description: "تم نسخ مفتاح API إلى الحافظة",
    });
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 py-8 mx-auto max-w-3xl">
        <header className="mb-8 animate-slide-up">
          <a href="/" className="flex items-center text-brand-brown hover:text-brand-coral mb-4 transition-colors">
            <ArrowRight className="ml-2" size={16} />
            <span>العودة إلى الرئيسية</span>
          </a>
          <h1 className="text-3xl font-bold text-brand-brown mb-3">إعدادات واجهة برمجة التطبيقات (API)</h1>
          <p className="text-muted-foreground">
            قم بتكوين واجهة برمجة التطبيقات (API) لتمكين استخراج النصوص وإرسالها تلقائيًا
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <Card className="animate-slide-up shadow-md" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center text-brand-brown">
                <Key className="ml-2" size={20} />
                مفتاح API
              </CardTitle>
              <CardDescription>
                أدخل مفتاح API لاستخدام خدمات استخراج النص والتكامل مع الأنظمة الخارجية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="text-sm font-medium">
                    مفتاح API:
                  </label>
                  <div className="flex">
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="أدخل مفتاح API الخاص بك هنا"
                      className="rtl-textarea text-right flex-1"
                      dir="rtl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={copyApiKey}
                      className="ml-2"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-md">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                    <span className="text-sm">
                      {isAuthenticated ? 'تم التحقق من المفتاح' : 'لم يتم التحقق من المفتاح بعد'}
                    </span>
                  </div>
                  <Button
                    onClick={handleVerifyApiKey}
                    disabled={isVerifying || !apiKey}
                    variant="default"
                    className="bg-brand-brown hover:bg-brand-brown/90"
                    size="sm"
                  >
                    {isVerifying ? 'جاري التحقق...' : 'تحقق'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up shadow-md" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center text-brand-brown">
                <Lock className="ml-2" size={20} />
                إعدادات الواجهة
              </CardTitle>
              <CardDescription>
                تخصيص كيفية عمل واجهة برمجة التطبيقات والتكامل مع أنظمتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="webhook" className="text-sm font-medium">
                    عنوان Webhook:
                  </label>
                  <Input
                    id="webhook"
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    className="rtl-textarea text-right"
                    dir="rtl"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيتم إرسال بيانات النص المستخرج إلى هذا العنوان
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">إرسال تلقائي</p>
                    <p className="text-xs text-muted-foreground">
                      إرسال البيانات المستخرجة تلقائيًا إلى الواجهة
                    </p>
                  </div>
                  <Switch
                    checked={isAutoSubmit}
                    onCheckedChange={setIsAutoSubmit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up shadow-md" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="flex items-center text-brand-brown">
                <Shield className="ml-2" size={20} />
                الأمان والخصوصية
              </CardTitle>
              <CardDescription>
                إعدادات الأمان والخصوصية لواجهة برمجة التطبيقات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">تشفير البيانات</p>
                    <p className="text-xs text-muted-foreground">
                      تشفير البيانات المرسلة عبر واجهة برمجة التطبيقات
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">سجل الأنشطة</p>
                    <p className="text-xs text-muted-foreground">
                      تسجيل جميع طلبات واجهة برمجة التطبيقات للمراجعة والتدقيق
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-brand-green hover:bg-brand-green/90">
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;
