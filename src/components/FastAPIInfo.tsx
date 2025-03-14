
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, ServerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FastAPIInfo = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
            <ServerIcon className="mr-2 h-5 w-5 text-brand-coral" />
            نظام FastAPI لإدخال البيانات
          </CardTitle>
          <CardDescription className="mt-1">
            واجهة برمجة تطبيقات سريعة لإدخال البيانات مباشرة إلى أنظمة شركات التوصيل
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="info">نظرة عامة</TabsTrigger>
              <TabsTrigger value="setup">الإعداد</TabsTrigger>
              <TabsTrigger value="usage">طريقة الاستخدام</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4 ml-2" />
                <AlertTitle>لماذا FastAPI؟</AlertTitle>
                <AlertDescription>
                  يوفر FastAPI واجهة برمجة قوية وسريعة لإدخال بياناتك مباشرة إلى أنظمة شركات التوصيل 
                  دون الحاجة إلى استخدام البوكماركلت أو الإدخال اليدوي.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">المميزات الرئيسية</h3>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>إدخال تلقائي للبيانات دون الحاجة للبوكماركلت</li>
                    <li>دعم متكامل لجميع شركات التوصيل الرئيسية</li>
                    <li>تكامل مباشر مع قواعد البيانات لتتبع الشحنات</li>
                    <li>واجهة برمجة تطبيقات RESTful سهلة الاستخدام</li>
                    <li>توثيق تلقائي لجميع الطلبات والاستجابات</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">الشركات المدعومة</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-brand-beige/20 p-2 rounded text-center">البريد العراقي</div>
                    <div className="bg-brand-beige/20 p-2 rounded text-center">ارامكس</div>
                    <div className="bg-brand-beige/20 p-2 rounded text-center">الفهد</div>
                    <div className="bg-brand-beige/20 p-2 rounded text-center">واصل</div>
                    <div className="bg-brand-beige/20 p-2 rounded text-center">DHL</div>
                    <div className="bg-brand-beige/20 p-2 rounded text-center">سبارك</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="setup">
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">متطلبات التشغيل</h3>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>خادم Python 3.9+ مع FastAPI مثبت</li>
                    <li>قاعدة بيانات PostgreSQL أو SQLite</li>
                    <li>حساب نشط في شركات التوصيل المدعومة</li>
                    <li>مفاتيح API من شركات التوصيل (للشركات التي توفرها)</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">خطوات إعداد الخادم</h3>
                  <ol className="list-decimal list-inside space-y-1 mr-4">
                    <li>تثبيت FastAPI: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">pip install fastapi uvicorn</code></li>
                    <li>تنزيل ملفات المشروع من صفحة GitHub</li>
                    <li>ضبط ملف الإعدادات <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">config.json</code></li>
                    <li>تشغيل الخادم: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">uvicorn main:app --reload</code></li>
                  </ol>
                </div>
                
                <div className="border rounded-md p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <InfoIcon className="h-4 w-4 ml-2" />
                    قيد التطوير
                  </h3>
                  <p className="text-sm">
                    نظام FastAPI حاليًا قيد التطوير النهائي. سيتم توفير رابط التنزيل والتوثيق الكامل قريبًا.
                    إذا كنت ترغب في الوصول المبكر، يرجى التواصل معنا.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="usage">
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">طريقة إرسال البيانات</h3>
                  <p className="text-sm mb-3">يمكن إرسال البيانات إلى واجهة برمجة التطبيقات بإحدى الطرق التالية:</p>
                  
                  <ol className="list-decimal list-inside space-y-2 mr-4">
                    <li>
                      <strong>طلب HTTP مباشر:</strong>
                      <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs mt-1 overflow-x-auto">
{`POST /api/v1/shipments
{
  "code": "123456",
  "senderName": "محمد أحمد",
  "phoneNumber": "07701234567",
  "province": "بغداد",
  "price": "25000"
}`}
                      </pre>
                    </li>
                    <li className="mt-3">
                      <strong>باستخدام واجهة الويب:</strong>
                      <p className="text-xs mt-1">يمكن تحميل البيانات مباشرة من خلال لوحة التحكم الخاصة بالنظام.</p>
                    </li>
                    <li className="mt-1">
                      <strong>التكامل المباشر:</strong>
                      <p className="text-xs mt-1">يوفر النظام مكتبات Python وJavaScript للتكامل المباشر مع تطبيقاتك.</p>
                    </li>
                  </ol>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">نماذج البيانات المدعومة</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-brand-beige/10">
                        <tr>
                          <th className="py-2 px-2 text-right">الحقل</th>
                          <th className="py-2 px-2 text-right">الوصف</th>
                          <th className="py-2 px-2 text-right">مطلوب</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-2">code</td>
                          <td className="py-2 px-2">رقم الشحنة أو الوصل</td>
                          <td className="py-2 px-2">نعم</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2">senderName</td>
                          <td className="py-2 px-2">اسم المرسل أو العميل</td>
                          <td className="py-2 px-2">نعم</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2">phoneNumber</td>
                          <td className="py-2 px-2">رقم هاتف العميل</td>
                          <td className="py-2 px-2">نعم</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-2">province</td>
                          <td className="py-2 px-2">المحافظة</td>
                          <td className="py-2 px-2">نعم</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2">price</td>
                          <td className="py-2 px-2">قيمة الشحنة</td>
                          <td className="py-2 px-2">نعم</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-between">
          <p className="text-xs text-muted-foreground">
            FastAPI - حل برمجي متكامل للشحن والتوصيل
          </p>
          <Button variant="outline" size="sm" className="text-xs">
            تواصل معنا للحصول على عرض تجريبي
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FastAPIInfo;
