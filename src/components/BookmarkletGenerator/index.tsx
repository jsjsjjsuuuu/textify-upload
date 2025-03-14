
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { saveToLocalStorage, getStoredItemsCount, clearStoredItems, generateBookmarkletCode } from "@/utils/bookmarkletService";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowDown, Copy, Trash, BookmarkIcon, Save, FileBox } from "lucide-react";

interface BookmarkletGeneratorProps {
  images: ImageData[];
}

const BookmarkletGenerator = ({ images }: BookmarkletGeneratorProps) => {
  const { toast } = useToast();
  const [storedCount, setStoredCount] = useState(0);
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");
  const [activeTab, setActiveTab] = useState("export");

  // تحديث عدد العناصر المخزنة والكود عند التحميل
  useEffect(() => {
    updateStoredCount();
    setBookmarkletUrl(generateBookmarkletCode());
  }, []);

  // تحديث عدد العناصر المخزنة
  const updateStoredCount = () => {
    setStoredCount(getStoredItemsCount());
  };

  // تصدير البيانات إلى localStorage
  const handleExport = () => {
    const count = saveToLocalStorage(images);
    updateStoredCount();
    
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
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">حالة البيانات:</h3>
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
                        {images.filter(img => img.status === "completed").length}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">العناصر المخزنة:</span>
                      <Badge variant={storedCount > 0 ? "default" : "outline"} className={storedCount > 0 ? "ml-2 bg-brand-green" : "ml-2"}>
                        {storedCount}
                      </Badge>
                    </div>
                  </div>
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
                    <li>1. اسحب الرابط أدناه إلى شريط المفضلة في متصفحك</li>
                    <li>2. قم بفتح موقع شركة التوصيل وتسجيل الدخول</li>
                    <li>3. انقر على الرابط في شريط المفضلة لتشغيل الأداة</li>
                    <li>4. استخدم لوحة التحكم لإدخال البيانات تلقائيًا</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">رابط الأداة (Bookmarklet):</h3>
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
                              title: "اسحب الرابط إلى شريط المفضلة",
                              description: "لا تنقر على الرابط، بل اسحبه إلى شريط المفضلة في متصفحك",
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
                    * اسحب الرابط (أداة نقل البيانات) إلى شريط المفضلة في متصفحك
                  </p>
                </div>
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
