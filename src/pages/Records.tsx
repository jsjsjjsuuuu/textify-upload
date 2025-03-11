
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Upload, PictureInPicture, Save, Brain, Brush, BarChart2, Settings } from "lucide-react";
import { testGeminiConnection } from "@/lib/gemini";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const Records = () => {
  const [savedApiKey, setSavedApiKey] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "failed">("untested");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // استخدام useCallback للوظائف المستخدمة في useEffect لتجنب إعادة الإنشاء
  const loadApiKey = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedApiKey = localStorage.getItem("geminiApiKey") || "";
      setSavedApiKey(storedApiKey);
      setApiKey(storedApiKey);

      // اختبار تلقائي للاتصال إذا كان المفتاح موجوداً
      if (storedApiKey) {
        const testResult = await testGeminiConnection(storedApiKey);
        setConnectionStatus(testResult.success ? "success" : "failed");
      }
    } catch (error) {
      console.error("خطأ في تحميل المفتاح:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

  const handleSaveApiKey = async () => {
    if (!apiKey) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مفتاح API صالح",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus("untested");
    
    try {
      const testResult = await testGeminiConnection(apiKey);
      setConnectionStatus(testResult.success ? "success" : "failed");
      
      if (testResult.success) {
        localStorage.setItem("geminiApiKey", apiKey);
        setSavedApiKey(apiKey);
        
        toast({
          title: "تم الحفظ",
          description: "تم حفظ مفتاح API بنجاح واختبار الاتصال",
        });
      } else {
        toast({
          title: "خطأ في الاتصال",
          description: testResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus("failed");
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء اختبار الاتصال",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  useEffect(() => {
    if (!apiKey && !savedApiKey && !isLoading) {
      const defaultApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      setApiKey(defaultApiKey);
      setSavedApiKey(defaultApiKey);
      localStorage.setItem("geminiApiKey", defaultApiKey);
      setConnectionStatus("untested");
      toast({
        title: "تم تعيين المفتاح الافتراضي",
        description: "تم تعيين مفتاح API الافتراضي بنجاح",
      });
    }
  }, [apiKey, savedApiKey, isLoading, toast]);

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case "success":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "success":
        return "الاتصال ناجح";
      case "failed":
        return "فشل الاتصال";
      default:
        return "لم يتم اختبار الاتصال";
    }
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
              <a href="/records" className="text-brand-brown font-medium hover:text-brand-coral transition-colors font-bold">
                السجلات
              </a>
            </li>
          </ul>
        </nav>

        <div className="grid grid-cols-1 gap-8">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>الإعدادات</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>الإحصائيات</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Brush className="h-4 w-4" />
                <span>الأدوات</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6 shadow-md bg-white/90 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-2xl font-bold text-brand-brown">إعدادات استخراج البيانات باستخدام Gemini</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-28 w-full" />
                    </div>
                  ) : (
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
                          <Button 
                            onClick={handleSaveApiKey} 
                            className="bg-brand-brown hover:bg-brand-brown/90"
                            disabled={isTestingConnection}
                          >
                            {isTestingConnection ? (
                              <span className="flex items-center">
                                <Brain className="h-4 w-4 ml-1 animate-pulse" />
                                جاري الاختبار...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Save className="h-4 w-4 ml-1" />
                                حفظ واختبار
                              </span>
                            )}
                          </Button>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          {savedApiKey && (
                            <p className={`text-xs ${getConnectionStatusClass()} flex items-center gap-1`}>
                              <span className={`inline-block w-2 h-2 rounded-full ${connectionStatus === 'success' ? 'bg-green-600' : connectionStatus === 'failed' ? 'bg-red-600' : 'bg-yellow-600'}`}></span>
                              {getConnectionStatusText()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            تم تعيين مفتاح API تلقائيًا: AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8
                          </p>
                        </div>
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <Card className="shadow-md bg-white/90 backdrop-blur-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-2xl font-bold text-brand-brown">إحصائيات المعالجة</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="text-center py-12">
                    <BarChart2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">سيتم عرض إحصائيات المعالجة هنا قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools">
              <Card className="shadow-md bg-white/90 backdrop-blur-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-2xl font-bold text-brand-brown">أدوات المعالجة</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button 
                      className="bg-brand-brown hover:bg-brand-brown/90 h-auto py-3 flex items-center gap-3 justify-start px-4" 
                      onClick={() => {
                        toast({
                          title: "جاري التطوير",
                          description: "هذه الميزة قيد التطوير وستكون متاحة قريباً",
                        });
                      }}
                    >
                      <div className="bg-white/20 p-2 rounded-full">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-semibold text-base">معالجة مجمعة</h3>
                        <p className="text-xs text-white/80">معالجة مجموعة من الصور دفعة واحدة</p>
                      </div>
                    </Button>
                    
                    <Button 
                      className="bg-brand-brown hover:bg-brand-brown/90 h-auto py-3 flex items-center gap-3 justify-start px-4" 
                      onClick={() => {
                        toast({
                          title: "جاري التطوير",
                          description: "هذه الميزة قيد التطوير وستكون متاحة قريباً",
                        });
                      }}
                    >
                      <div className="bg-white/20 p-2 rounded-full">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-semibold text-base">ضبط معالجة الذكاء الاصطناعي</h3>
                        <p className="text-xs text-white/80">تخصيص إعدادات نماذج الذكاء الاصطناعي</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Records;
