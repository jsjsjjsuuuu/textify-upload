
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Upload, PictureInPicture, Save } from "lucide-react";

const Records = () => {
  const [savedApiKey, setSavedApiKey] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // استرجاع مفتاح API من التخزين المحلي عند تحميل الصفحة
    const storedApiKey = localStorage.getItem("geminiApiKey") || "";
    setSavedApiKey(storedApiKey);
    setApiKey(storedApiKey);
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مفتاح API صالح",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("geminiApiKey", apiKey);
    setSavedApiKey(apiKey);
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ مفتاح API بنجاح",
    });
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 py-8 mx-auto max-w-6xl">
        <header className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold text-brand-brown mb-3">السجلات واستخراج البيانات</h1>
        </header>

        <nav className="mb-8 flex justify-end">
          <ul className="flex gap-6 py-[3px] my-0 mx-[240px] px-[174px]">
            <li>
              <a href="/" className="text-brand-brown font-medium hover:text-brand-coral transition-colors my-[46px]">
                الرئيسية
              </a>
            </li>
            <li>
              <a href="/api" className="text-brand-brown font-medium hover:text-brand-coral transition-colors">
                API
              </a>
            </li>
            <li>
              <a href="/records" className="text-brand-brown font-medium hover:text-brand-coral transition-colors">
                السجلات
              </a>
            </li>
          </ul>
        </nav>

        <div className="grid grid-cols-1 gap-8">
          <Card className="p-6 shadow-md bg-white/90 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-brand-brown mb-6">إعدادات استخراج البيانات باستخدام Gemini</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium mb-1">مفتاح API لـ Gemini:</label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="أدخل مفتاح API لـ Gemini هنا"
                    className="flex-1"
                    dir="ltr"
                  />
                  <Button onClick={handleSaveApiKey} className="bg-brand-brown hover:bg-brand-brown/90">
                    <Save className="h-4 w-4 ml-1" />
                    حفظ
                  </Button>
                </div>
                {savedApiKey && (
                  <p className="text-xs text-green-600 mt-1">تم تكوين مفتاح API بنجاح!</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  يمكنك الحصول على مفتاح API لـ Gemini من{" "}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-coral hover:underline"
                  >
                    لوحة تحكم Google AI Studio
                  </a>
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <PictureInPicture className="h-5 w-5 text-brand-brown mr-2" />
                  <h3 className="text-lg font-semibold">ميزات استخراج البيانات</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>استخراج تلقائي للبيانات من الصور مثل الكود، الاسم، رقم الهاتف، الخ.</li>
                  <li>دعم اللغة العربية بشكل كامل.</li>
                  <li>تحليل متقدم للصور باستخدام نماذج الذكاء الاصطناعي من Google Gemini.</li>
                  <li>تحويل النص المستخرج إلى هيكل بيانات منظم.</li>
                </ul>
              </div>

              <div className="bg-brand-brown/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">كيفية استخدام الميزة:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>قم بإدخال مفتاح API لـ Gemini واحفظه.</li>
                  <li>عد إلى الصفحة الرئيسية وقم برفع الصور كالمعتاد.</li>
                  <li>سيتم استخدام Gemini لاستخراج البيانات تلقائيًا من الصور المرفوعة.</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Records;
