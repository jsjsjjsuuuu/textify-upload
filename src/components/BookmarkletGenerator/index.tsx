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

// تحديث واجهة الخصائص لتشمل storedCount و readyCount
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

  // تحديث عدد العناصر المخزنة والكود عند التحميل مرة واحدة فقط
  useEffect(() => {
    const currentCount = getStoredItemsCount();
    setStoredCount(currentCount);
    setBookmarkletUrl(generateBookmarkletCode());
    
    const currentStats = getStorageStats();
    setStats(currentStats);
  }, []); // مصفوفة تبعيات فارغة تعني أن هذا الكود يعمل مرة واحدة فقط عند تحميل المكون

  // تحديث القيم عندما تتغير الخصائص من الأعلى
  useEffect(() => {
    if (initialStoredCount !== storedCount) {
      setStoredCount(initialStoredCount);
      setStats(prev => ({
        ...prev,
        total: initialStoredCount,
        ready: initialReadyCount
      }));
    }
  }, [initialStoredCount, initialReadyCount]); // التبعيات الصحيحة

  // تحديث عدد العناصر المخزنة
  const updateStoredCount = () => {
    const count = getStoredItemsCount();
    setStoredCount(count);
  };
  
  // تحديث إحصائيات التخزين
  const updateStats = () => {
    const currentStats = getStorageStats();
    setStats(currentStats);
  };

  // تصدير البيانات إلى localStorage
  const handleExport = () => {
    const count = saveToLocalStorage(images);
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
        description: "تأكد من وجود بيانات كاملة (الكود، الاسم، رقم الهاتف، المحافظة)",
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
    setBookmarkletUrl(generateBookmarkletCode());
    toast({
      title: "تم إعادة إنشاء الرابط",
      description: "تم تحديث رمز Bookmarklet بأحدث التغييرات",
      variant: "default"
    });
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
                        {images.filter(img => img.status === "completed").length || 0}
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
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">كيفية الاستخدام:</h3>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li>1. اسحب الرابط أدناه إلى شريط الإشارات المرجعية/المفضلة في المتصفح</li>
                    <li>2. قم بفتح موقع شركة التوصيل وتسجيل الدخول</li>
                    <li>3. انقر على الرابط المحفوظ في شريط الإشارات المرجعية لتشغيل الأداة</li>
                    <li>4. استخدم لوحة التحكم لإدخال البيانات تلقائيًا</li>
                  </ol>
                  <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md p-2">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>ملاحظة:</strong> شريط الإشارات المرجعية (Bookmarks) يسمى أيضًا "المفضلة" في بعض المتصفحات، وهو الشريط الذي يظهر أعلى المتصفح ويحتوي على روابط المواقع المحفوظة.
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">رابط الأداة (Bookmarklet):</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-xs h-7 px-2"
                    >
                      {showAdvanced ? "إخفاء الخيارات المتقدمة" : "خيارات متقدمة"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-1 relative">
                      <div className="border rounded-md px-3 py-2 bg-muted text-sm truncate overflow-hidden">
                        <ArrowDown className="absolute top-2 left-2 h-4 w-4 text-muted-foreground animate-bounce" />
                        <a 
                          href={bookmarkletUrl} 
                          className="text-brand-coral hover:text-brand-coral/80 hover:underline font-mono"
                          onClick={(e) => {
                            e.preventDefault();
                            toast({
                              title: "اسحب الرابط إلى شريط الإشارات المرجعية",
                              description: "لا تنقر على الرابط، بل اسحبه إلى شريط الإشارات المرجعية (المفضلة) في متصفحك",
                              variant: "default"
                            });
                          }}
                        >
                          أداة نقل البيانات
                        </a>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleCopyBookmarklet}
                      className="ml-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * اسحب الرابط (أداة نقل البيانات) إلى شريط الإشارات المرجعية في متصفحك
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-md">
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400">كيفية إظهار شريط الإشارات المرجعية:</h4>
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
