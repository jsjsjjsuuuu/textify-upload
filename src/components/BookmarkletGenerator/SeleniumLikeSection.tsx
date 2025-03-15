
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookmarkletItem } from "@/types/ImageData";

interface SeleniumLikeSectionProps {
  recordsCount: number;
}

export const SeleniumLikeSection: React.FC<SeleniumLikeSectionProps> = ({ recordsCount }) => {
  const [useSeleniumLike, setUseSeleniumLike] = useState(true);
  
  // نموذج شفرة استخدام نظام محاكاة السيلينيوم
  const seleniumLikeCode = `// استخدام نظام ملء النماذج الشبيه بالسيلينيوم
const data = JSON.parse(localStorage.getItem('current_record'));
const controller = window.bookmarkletControls.createSeleniumController(data);

// يمكنك برمجة إجراءات مخصصة
controller
  .setDebugMode(true)         // تفعيل وضع التصحيح
  .setDelay(200)              // ضبط التأخير بين الإجراءات (مللي ثانية)
  .waitForPageLoad()          // انتظار تحميل الصفحة
  .waitForElement('#customerCode', 5000)  // انتظار ظهور عنصر محدد (5 ثوان كحد أقصى)
  .typeText('#customerCode', data.code)   // كتابة الكود
  .typeText('#customerName', data.senderName)  // كتابة اسم المرسل
  .typeText('#phone', data.phoneNumber)   // كتابة رقم الهاتف
  .selectOption('#province', data.province)  // اختيار المحافظة
  .click('#submit')           // النقر على زر الإرسال
  .execute();                 // تنفيذ سلسلة الإجراءات`;

  // نموذج للكود التلقائي البسيط
  const autoFillCode = `// الاستخدام السريع والتلقائي
const data = JSON.parse(localStorage.getItem('current_record'));
window.bookmarkletControls.runQuickAutomation(data);`;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>نظام محاكاة السيلينيوم</span>
          <Badge variant="outline" className="mr-2 bg-amber-100">جديد</Badge>
        </CardTitle>
        <CardDescription>
          استخدم واجهة برمجية تشبه Selenium للتحكم بدقة في عملية ملء النماذج وأتمتة إدخال البيانات
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            id="selenium-mode"
            checked={useSeleniumLike}
            onCheckedChange={setUseSeleniumLike}
          />
          <Label htmlFor="selenium-mode">تفعيل نظام محاكاة السيلينيوم</Label>
        </div>
        
        {useSeleniumLike && (
          <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
            <h3 className="text-base font-medium mb-2">مزايا نظام محاكاة السيلينيوم:</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
              <li>تحكم دقيق في تسلسل العمليات وإجراءات الإدخال</li>
              <li>إمكانية الانتظار لتحميل العناصر في الصفحة</li>
              <li>محاكاة الكتابة البشرية (حرفًا بحرفًا)</li>
              <li>التعامل المتقدم مع القوائم المنسدلة</li>
              <li>وضع تصحيح الأخطاء للمساعدة في حل المشكلات</li>
            </ul>
            
            <Tabs defaultValue="auto" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">التعبئة التلقائية</TabsTrigger>
                <TabsTrigger value="custom">الإجراءات المخصصة</TabsTrigger>
              </TabsList>
              
              <TabsContent value="auto" className="mt-2">
                <div className="text-sm">
                  <p className="mb-2">الاستخدام الأبسط - يكتشف الحقول ويملؤها تلقائيًا:</p>
                  <pre className="bg-slate-950 text-slate-50 p-4 overflow-x-auto text-xs font-mono rounded-md">
                    {autoFillCode}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="mt-2">
                <div className="text-sm">
                  <p className="mb-2">تخصيص كامل لتسلسل الإجراءات:</p>
                  <pre className="bg-slate-950 text-slate-50 p-4 overflow-x-auto text-xs font-mono rounded-md">
                    {seleniumLikeCode}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-slate-500">
          {recordsCount > 0
            ? `جاهز للاستخدام مع ${recordsCount} سجل مخزن`
            : 'قم بمعالجة واستخراج بيانات من الصور أولاً'}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // فتح مستند المساعدة
            window.open('https://github.com/SeleniumHQ/selenium/wiki/Getting-Started', '_blank');
          }}
        >
          تعلم المزيد
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SeleniumLikeSection;
