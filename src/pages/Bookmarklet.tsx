
import { useState, useEffect } from "react";
import BackgroundPattern from "@/components/BackgroundPattern";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFromLocalStorage, clearStoredItems, generateBookmarkletCode } from "@/utils/bookmarkletService";
import { useToast } from "@/hooks/use-toast";
import { BookmarkIcon, Copy, CopyCheck, ArrowDown, RefreshCw, Trash, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Bookmarklet = () => {
  const { toast } = useToast();
  const [bookmarkletData, setBookmarkletData] = useState<any>(null);
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBookmarkletData();
    setBookmarkletUrl(generateBookmarkletCode());
  }, []);

  const loadBookmarkletData = () => {
    const data = getFromLocalStorage();
    setBookmarkletData(data);
  };

  const handleClearData = () => {
    clearStoredItems();
    loadBookmarkletData();
    toast({
      title: "تم مسح البيانات",
      description: "تم مسح جميع البيانات المخزنة في ذاكرة المتصفح",
      variant: "default"
    });
  };

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط Bookmarklet إلى الحافظة",
        variant: "default"
      });
    });
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />

        <div className="mt-6">
          <div className="flex items-center mb-6">
            <Link to="/" className="text-brand-brown hover:text-brand-coral transition-colors">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                <span>العودة إلى الرئيسية</span>
              </Button>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
                  <BookmarkIcon className="mr-2 h-5 w-5 text-brand-coral" />
                  أداة نقل البيانات (Bookmarklet)
                </CardTitle>
                <CardDescription>
                  استخدم هذه الأداة لنقل البيانات المستخرجة تلقائيًا إلى مواقع شركات التوصيل
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="setup">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="setup">إعداد الأداة</TabsTrigger>
                    <TabsTrigger value="data">البيانات المخزنة</TabsTrigger>
                    <TabsTrigger value="guide">دليل الاستخدام</TabsTrigger>
                  </TabsList>

                  {/* قسم إعداد الأداة */}
                  <TabsContent value="setup">
                    <div className="space-y-6">
                      <div className="bg-secondary/30 rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">كيفية الإعداد:</h3>
                        <ol className="text-sm space-y-2 text-muted-foreground mr-4">
                          <li>اسحب الرابط أدناه إلى شريط المفضلة في متصفحك</li>
                          <li>قم بتصدير البيانات المستخرجة من الصفحة الرئيسية</li>
                          <li>افتح موقع شركة التوصيل وتسجيل الدخول</li>
                          <li>انقر على الرابط في شريط المفضلة لتشغيل الأداة</li>
                        </ol>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">رابط الأداة (Bookmarklet):</h3>
                        <div className="flex flex-col">
                          <div className="relative">
                            <div className="border rounded-md px-3 py-2 bg-muted text-sm truncate overflow-hidden">
                              <ArrowDown className="absolute top-2 left-2 h-4 w-4 text-muted-foreground animate-bounce" />
                              <a 
                                href={bookmarkletUrl} 
                                className="text-brand-coral hover:text-brand-coral/80 hover:underline font-mono"
                                onClick={(e) => e.preventDefault()}
                                title="اسحب هذا الرابط إلى شريط المفضلة"
                              >
                                أداة نقل البيانات
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                              * اسحب الرابط إلى شريط المفضلة في متصفحك
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleCopyBookmarklet}
                              className="gap-1"
                            >
                              {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              <span className="text-xs">{copied ? "تم النسخ" : "نسخ الرابط"}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* قسم البيانات المخزنة */}
                  <TabsContent value="data">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadBookmarkletData}
                          className="gap-1"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span className="text-xs">تحديث</span>
                        </Button>

                        {bookmarkletData && bookmarkletData.items && bookmarkletData.items.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleClearData}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                          >
                            <Trash className="h-3.5 w-3.5" />
                            <span className="text-xs">مسح البيانات</span>
                          </Button>
                        )}
                      </div>

                      {!bookmarkletData || !bookmarkletData.items || bookmarkletData.items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>لا توجد بيانات مخزنة حاليًا</p>
                          <p className="text-xs mt-2">قم بتصدير البيانات من الصفحة الرئيسية أولاً</p>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-secondary/30 rounded-lg p-3 mb-3">
                            <p className="text-sm">
                              إجمالي العناصر: <span className="font-medium">{bookmarkletData.items.length}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              تاريخ التصدير: {new Date(bookmarkletData.exportDate).toLocaleString("ar")}
                            </p>
                          </div>
                          
                          <div className="border rounded-md overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="px-3 py-2 text-right">#</th>
                                    <th className="px-3 py-2 text-right">الكود</th>
                                    <th className="px-3 py-2 text-right">الاسم</th>
                                    <th className="px-3 py-2 text-right">الهاتف</th>
                                    <th className="px-3 py-2 text-right">المحافظة</th>
                                    <th className="px-3 py-2 text-right">السعر</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bookmarkletData.items.slice(0, 10).map((item: any, index: number) => (
                                    <tr key={item.id} className="border-t border-muted">
                                      <td className="px-3 py-2">{index + 1}</td>
                                      <td className="px-3 py-2">{item.code}</td>
                                      <td className="px-3 py-2">{item.senderName}</td>
                                      <td className="px-3 py-2" dir="ltr">{item.phoneNumber}</td>
                                      <td className="px-3 py-2">{item.province}</td>
                                      <td className="px-3 py-2">{item.price}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {bookmarkletData.items.length > 10 && (
                              <div className="bg-muted text-center py-1 text-xs text-muted-foreground">
                                تم عرض 10 من {bookmarkletData.items.length} عنصر
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* قسم دليل الاستخدام */}
                  <TabsContent value="guide">
                    <div className="space-y-4">
                      <div className="bg-secondary/30 rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">خطوات الاستخدام:</h3>
                        <ol className="text-sm space-y-3 text-muted-foreground mr-4">
                          <li>
                            <strong>الإعداد (مرة واحدة):</strong>
                            <ul className="mr-4 mt-1">
                              <li>اسحب رابط "أداة نقل البيانات" إلى شريط المفضلة في متصفحك</li>
                              <li>ستظهر كأيقونة مفضلة في شريط المتصفح</li>
                            </ul>
                          </li>
                          <li>
                            <strong>تحليل الصور واستخراج البيانات:</strong>
                            <ul className="mr-4 mt-1">
                              <li>قم برفع صور الوصولات في الصفحة الرئيسية</li>
                              <li>تأكد من صحة البيانات المستخرجة وقم بتصحيحها إذا لزم الأمر</li>
                            </ul>
                          </li>
                          <li>
                            <strong>تصدير البيانات:</strong>
                            <ul className="mr-4 mt-1">
                              <li>اضغط على زر "تصدير البيانات إلى ذاكرة المتصفح"</li>
                              <li>سيتم حفظ البيانات في ذاكرة المتصفح المحلية</li>
                            </ul>
                          </li>
                          <li>
                            <strong>استخدام الأداة في موقع شركة التوصيل:</strong>
                            <ul className="mr-4 mt-1">
                              <li>افتح موقع شركة التوصيل وقم بتسجيل الدخول</li>
                              <li>انتقل إلى صفحة إدخال بيانات الوصل</li>
                              <li>انقر على "أداة نقل البيانات" في شريط المفضلة</li>
                              <li>ستظهر لوحة تحكم صغيرة في الموقع</li>
                              <li>اختر "إدخال بيانات أول عنصر" لملء النموذج تلقائيًا</li>
                            </ul>
                          </li>
                        </ol>
                      </div>

                      <div className="bg-secondary/30 rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-2">ملاحظات هامة:</h3>
                        <ul className="text-sm space-y-1 text-muted-foreground mr-4">
                          <li>تعمل الأداة فقط على المتصفحات الحديثة (Chrome, Firefox, Edge, Safari)</li>
                          <li>البيانات تُخزن محليًا في متصفحك ولا يتم إرسالها لأي خادم خارجي</li>
                          <li>قد تحتاج لتعديل الإعدادات الأمنية للمتصفح للسماح بتشغيل الـ Bookmarklet</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Bookmarklet;
