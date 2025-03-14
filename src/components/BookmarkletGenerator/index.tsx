
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { saveToLocalStorage, getStoredItemsCount, clearStoredItems, generateBookmarkletCode, getStorageStats } from "@/utils/bookmarkletService";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowDown, Copy, Trash, BookmarkIcon, Save, FileBox, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

// تحديث واجهة الخصائص
interface BookmarkletGeneratorProps {
  images: ImageData[];
  storedCount?: number;
  readyCount?: number;
}

const BookmarkletGenerator = ({ images, storedCount: initialStoredCount = 0, readyCount: initialReadyCount = 0 }: BookmarkletGeneratorProps) => {
  const { toast } = useToast();
  const [storedCount, setStoredCount] = useState(initialStoredCount);
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");
  const [activeTab, setActiveTab] = useState("export");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stats, setStats] = useState({
    total: initialStoredCount,
    ready: initialReadyCount,
    success: 0,
    error: 0,
    lastUpdate: null as Date | null
  });
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

  // تحديث عدد العناصر المخزنة والكود عند التحميل مرة واحدة فقط
  useEffect(() => {
    console.log("BookmarkletGenerator: تحميل البيانات الأولية");
    const currentCount = getStoredItemsCount();
    setStoredCount(currentCount);
    
    // تأخير توليد رابط البوكماركلت للتأكد من استقرار واجهة المستخدم أولاً
    setIsGeneratingUrl(true);
    setTimeout(() => {
      try {
        const url = generateBookmarkletCode();
        setBookmarkletUrl(url);
        console.log("تم إنشاء رابط البوكماركلت بطول:", url.length);
      } catch (error) {
        console.error("خطأ في إنشاء رابط البوكماركلت:", error);
        toast({
          title: "خطأ في إنشاء رابط الأداة",
          description: "حدث خطأ أثناء توليد رابط البوكماركلت. حاول مرة أخرى.",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingUrl(false);
      }
    }, 500);
    
    const currentStats = getStorageStats();
    setStats(currentStats);
  }, []); // مصفوفة تبعيات فارغة تعني أن هذا الكود يعمل مرة واحدة فقط عند تحميل المكون

  // تحديث القيم عندما تتغير الخصائص من الأعلى
  useEffect(() => {
    if (initialStoredCount !== storedCount) {
      console.log("تحديث من الخصائص:", { initialStoredCount, initialReadyCount });
      setStoredCount(initialStoredCount);
      setStats(prev => ({
        ...prev,
        total: initialStoredCount,
        ready: initialReadyCount
      }));
    }
  }, [initialStoredCount, initialReadyCount, storedCount]); // التبعيات الصحيحة

  // تحديث عدد العناصر المخزنة
  const updateStoredCount = () => {
    const count = getStoredItemsCount();
    console.log("تحديث عدد العناصر المخزنة:", count);
    setStoredCount(count);
  };
  
  // تحديث إحصائيات التخزين
  const updateStats = () => {
    const currentStats = getStorageStats();
    console.log("تحديث إحصائيات التخزين:", currentStats);
    setStats(currentStats);
  };

  // تصدير البيانات إلى localStorage
  const handleExport = () => {
    console.log("تصدير البيانات:", images.length, "صورة");
    
    // تصفية الصور للتأكد من وجود البيانات الأساسية
    const validImages = images.filter(img => img.code && img.senderName && img.phoneNumber);
    console.log("عدد الصور الصالحة:", validImages.length);
    
    if (validImages.length === 0) {
      toast({
        title: "لا توجد بيانات كاملة",
        description: "تأكد من إكمال الحقول الأساسية (الكود، الاسم، رقم الهاتف) لصورة واحدة على الأقل",
        variant: "destructive"
      });
      return;
    }
    
    const count = saveToLocalStorage(validImages);
    updateStoredCount();
    updateStats();
    
    if (count > 0) {
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: `تم تصدير ${count} عنصر إلى ذاكرة المتصفح`,
        variant: "default"
      });
    } else {
      toast({
        title: "تعذر تصدير البيانات",
        description: "تأكد من وجود بيانات كاملة (الكود، الاسم، رقم الهاتف)",
        variant: "destructive"
      });
    }
  };

  // مسح البيانات المخزنة
  const handleClear = () => {
    clearStoredItems();
    updateStoredCount();
    updateStats();
    toast({
      title: "تم مسح البيانات",
      description: "تم مسح جميع البيانات المخزنة من ذاكرة المتصفح",
      variant: "default"
    });
  };

  // نسخ رابط Bookmarklet
  const handleCopyBookmarklet = () => {
    if (!bookmarkletUrl) {
      toast({
        title: "الرابط غير جاهز",
        description: "جاري إنشاء الرابط، انتظر لحظة من فضلك",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(bookmarkletUrl).then(() => {
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط Bookmarklet إلى الحافظة",
        variant: "default"
      });
    });
  };
  
  // إعادة إنشاء كود Bookmarklet
  const handleRegenerateBookmarklet = () => {
    try {
      setIsGeneratingUrl(true);
      const newUrl = generateBookmarkletCode();
      setBookmarkletUrl(newUrl);
      setIsGeneratingUrl(false);
      
      toast({
        title: "تم إعادة إنشاء الرابط",
        description: "تم تحديث رمز Bookmarklet بأحدث التغييرات",
        variant: "default"
      });
    } catch (error) {
      console.error("خطأ في إعادة إنشاء رابط البوكماركلت:", error);
      setIsGeneratingUrl(false);
      
      toast({
        title: "خطأ في إعادة إنشاء الرابط",
        description: "حدث خطأ أثناء توليد رابط البوكماركلت. حاول مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // معالجة السحب والإفلات للبوكماركلت
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    // لا نحتاج لأي إجراء خاص هنا، المتصفح يتعامل مع السحب بشكل طبيعي
    console.log("بدء سحب رابط البوكماركلت");
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
                <BookmarkIcon className="mr-2 h-5 w-5 text-brand-coral" />
                أداة نقل البيانات (Bookmarklet)
              </CardTitle>
              <CardDescription className="mt-1">
                نقل البيانات المستخرجة تلقائيًا إلى مواقع شركات التوصيل
              </CardDescription>
            </div>
            {storedCount > 0 && (
              <Badge variant="outline" className="bg-brand-green/10 text-brand-green border-brand-green/20">
                <FileBox className="h-3.5 w-3.5 mr-1" />
                {storedCount} عنصر مخزن
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="export" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="export">تصدير البيانات</TabsTrigger>
              <TabsTrigger value="bookmarklet">إعداد الـ Bookmarklet</TabsTrigger>
            </TabsList>
            
            {/* قسم تصدير البيانات */}
            <TabsContent value="export">
              <div className="space-y-4">
                {/* جزء عرض الإحصائيات */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                    <span>حالة البيانات:</span>
                    {stats.lastUpdate && (
                      <span className="text-xs text-muted-foreground">
                        آخر تحديث: {stats.lastUpdate.toLocaleTimeString()}
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-muted-foreground">إجمالي الصور:</span>
                      <Badge variant="outline" className="ml-2">
                        {images.length}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">العناصر المكتملة:</span>
                      <Badge variant="outline" className="ml-2">
                        {images.filter(img => img.code && img.senderName && img.phoneNumber).length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">العناصر المخزنة:</span>
                      <Badge variant={stats.total > 0 ? "default" : "outline"} className={stats.total > 0 ? "ml-2 bg-brand-green" : "ml-2"}>
                        {stats.total}
                      </Badge>
                    </div>
                    {stats.total > 0 && (
                      <div className="flex items-center">
                        <span className="text-muted-foreground">جاهزة للإدخال:</span>
                        <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-600 border-blue-200">
                          {stats.ready}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {stats.total > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {stats.success > 0 && (
                        <div className="flex items-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                          <span className="text-xs text-green-600">تم إدخال {stats.success} وصل بنجاح</span>
                        </div>
                      )}
                      {stats.error > 0 && (
                        <div className="flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                          <span className="text-xs text-red-600">فشل إدخال {stats.error} وصل</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Button onClick={handleExport} className="bg-brand-green hover:bg-brand-green/90">
                    <Save className="h-4 w-4 ml-2" />
                    تصدير البيانات إلى ذاكرة المتصفح
                  </Button>
                  
                  {storedCount > 0 && (
                    <Button variant="outline" onClick={handleClear} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Trash className="h-4 w-4 ml-2" />
                      مسح البيانات المخزنة
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* قسم إعداد Bookmarklet */}
            <TabsContent value="bookmarklet">
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                    هام - تأكد من إتمام هذه الخطوات بالترتيب:
                  </h3>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-amber-700 dark:text-amber-400">
                    <li><strong>قم بتصدير البيانات أولاً</strong> في صفحة "تصدير البيانات"</li>
                    <li><strong>اسحب</strong> الرابط أدناه إلى شريط الإشارات المرجعية/المفضلة في المتصفح</li>
                    <li>انتقل إلى <strong>موقع شركة التوصيل</strong> وسجل الدخول</li>
                    <li>انقر على <strong>رابط أداة نقل البيانات</strong> في شريط الإشارات المرجعية</li>
                  </ol>
                </div>
                
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">كيفية إضافة الأداة للمتصفح:</h3>
                  
                  <div className="flex items-center">
                    <div className="flex-1 relative">
                      <div className="border rounded-md px-3 py-2 bg-muted text-sm truncate overflow-hidden text-center relative">
                        <ArrowDown className="absolute top-2 left-2 h-4 w-4 text-muted-foreground animate-bounce" />
                        
                        {isGeneratingUrl ? (
                          <span className="text-muted-foreground">جاري إنشاء الرابط...</span>
                        ) : (
                          <a 
                            href={bookmarkletUrl} 
                            className="text-brand-coral hover:text-brand-coral/80 hover:underline font-mono"
                            draggable="true"
                            onDragStart={handleDragStart}
                            onClick={(e) => {
                              e.preventDefault();
                              toast({
                                title: "اسحب الرابط إلى شريط المفضلة",
                                description: "لا تنقر على الرابط، بل اسحبه إلى شريط الإشارات المرجعية (المفضلة) في متصفحك",
                                variant: "default"
                              });
                            }}
                          >
                            أداة نقل البيانات
                          </a>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleCopyBookmarklet}
                      className="ml-2"
                      disabled={isGeneratingUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2 flex items-center">
                    <ArrowDown className="h-3 w-3 mr-1 inline-block" />
                    <strong>اسحب الرابط</strong> (أداة نقل البيانات) إلى شريط الإشارات المرجعية في متصفحك
                  </p>
                  
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-md">
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400">كيفية إظهار شريط الإشارات المرجعية (المفضلة):</h4>
                    <ul className="text-xs text-blue-600 dark:text-blue-500 mt-1 list-disc list-inside space-y-1">
                      <li>Chrome: انقر على ⋮ (ثلاث نقاط) ثم الإشارات المرجعية → إظهار شريط الإشارات المرجعية</li>
                      <li>Firefox: انقر بزر الماوس الأيمن على شريط العناوين → إظهار شريط الإشارات المرجعية</li>
                      <li>Edge: انقر على ⋯ (ثلاث نقاط) ثم الإشارات المرجعية → إظهار شريط الإشارات المرجعية</li>
                    </ul>
                  </div>
                </div>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-3">
                    <Separator />
                    <h3 className="text-sm font-medium pt-2">خيارات متقدمة:</h3>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRegenerateBookmarklet}
                      className="w-full"
                      disabled={isGeneratingUrl}
                    >
                      <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
                      إعادة إنشاء رمز Bookmarklet
                    </Button>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md p-3 mt-2">
                      <h4 className="text-xs font-medium text-amber-800 dark:text-amber-400 flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        ملاحظات هامة
                      </h4>
                      <ul className="text-xs text-amber-700 dark:text-amber-500 mt-1 space-y-1 list-disc list-inside">
                        <li>قد تحتاج لإعادة إنشاء الرابط بعد تحديثات النظام</li>
                        <li>بعض المواقع قد تمنع تشغيل البرامج النصية الخارجية</li>
                        <li>للحصول على أفضل النتائج، استخدم متصفح Chrome أو Firefox أو Edge</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs w-full mt-2"
                >
                  {showAdvanced ? "إخفاء الخيارات المتقدمة" : "إظهار الخيارات المتقدمة"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          <p>
            ملاحظة: تعمل هذه الأداة في المتصفح فقط ولا يتم إرسال بياناتك إلى أي خادم خارجي
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default BookmarkletGenerator;
