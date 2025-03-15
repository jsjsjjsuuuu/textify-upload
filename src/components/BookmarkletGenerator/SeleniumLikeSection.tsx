
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkletItem } from "@/types/ImageData";

interface SeleniumLikeSectionProps {
  recordsCount: number;
}

export const SeleniumLikeSection: React.FC<SeleniumLikeSectionProps> = ({ recordsCount }) => {
  const [useSeleniumLike, setUseSeleniumLike] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customScript, setCustomScript] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  
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

  // نموذج جديد يدعم XPath
  const xpathExampleCode = `// استخدام XPath للعثور على عناصر معقدة
const data = JSON.parse(localStorage.getItem('current_record'));
const controller = window.bookmarkletControls.createSeleniumController(data);

controller
  .setDebugMode(true)
  .waitForPageLoad()
  // استخدام XPath بدلاً من CSS Selectors
  .typeTextByXPath("//label[contains(text(), 'رقم الوصل')]/following::input[1]", data.code)
  .typeTextByXPath("//label[contains(text(), 'اسم المرسل')]/following::input[1]", data.senderName)
  .typeTextByXPath("//label[contains(text(), 'رقم الهاتف')]/following::input[1]", data.phoneNumber)
  // يمكن الجمع بين XPath و CSS Selectors
  .selectOption('#province', data.province)
  // البحث عن زر الإرسال بواسطة النص
  .clickElementByXPath("//button[contains(text(), 'حفظ')]")
  .execute();`;

  // نموذج للكود التلقائي البسيط
  const autoFillCode = `// الاستخدام السريع والتلقائي
const data = JSON.parse(localStorage.getItem('current_record'));
window.bookmarkletControls.runQuickAutomation(data);`;

  // وظيفة لتوليد رمز مخصص بناءً على المدخلات
  const generateCustomCode = () => {
    if (!targetUrl) return seleniumLikeCode;
    
    return `// استخدام نظام ملء النماذج الشبيه بالسيلينيوم
const data = JSON.parse(localStorage.getItem('current_record'));
const controller = window.bookmarkletControls.createSeleniumController(data);

// التحقق من أننا على الصفحة الصحيحة
if (window.location.href !== "${targetUrl}") {
  window.location.href = "${targetUrl}";
  // سيتم تنفيذ الشفرة تلقائيًا بعد تحميل الصفحة
} else {
  controller
    .setDebugMode(true)
    .setDelay(300)
    .waitForPageLoad()
    // البحث تلقائيًا عن الحقول باستخدام XPath و CSS
    .findAndFillField('code', data.code)
    .findAndFillField('senderName', data.senderName)
    .findAndFillField('phoneNumber', data.phoneNumber)
    .findAndFillField('province', data.province)
    .findAndFillField('price', data.price)
    // محاولة النقر على زر الحفظ تلقائيًا
    .clickSaveButton()
    .execute();
}`;
  };

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
              <li>دعم XPath للعثور على العناصر المعقدة</li>
              <li>القدرة على التنقل بين الصفحات والنماذج</li>
            </ul>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse mt-4">
              <Switch
                id="advanced-mode"
                checked={advancedMode}
                onCheckedChange={setAdvancedMode}
              />
              <Label htmlFor="advanced-mode">إظهار الإعدادات المتقدمة</Label>
            </div>
            
            {advancedMode && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="target-url">عنوان URL للنموذج المستهدف (اختياري)</Label>
                  <Input
                    id="target-url"
                    placeholder="https://example.com/form"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    إذا تم تحديده، سيتم توجيه المستخدم إلى هذا العنوان قبل ملء النموذج
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="custom-script">سكريبت مخصص</Label>
                  <Textarea
                    id="custom-script"
                    placeholder="// أضف كود JavaScript مخصص هنا"
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    className="mt-1 font-mono text-xs h-40"
                  />
                </div>
              </div>
            )}
            
            <Tabs defaultValue="auto" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="auto">التعبئة التلقائية</TabsTrigger>
                <TabsTrigger value="custom">الإجراءات المخصصة</TabsTrigger>
                <TabsTrigger value="xpath">دعم XPath</TabsTrigger>
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
                    {targetUrl ? generateCustomCode() : seleniumLikeCode}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="xpath" className="mt-2">
                <div className="text-sm">
                  <p className="mb-2">استخدام XPath للعثور على عناصر معقدة:</p>
                  <pre className="bg-slate-950 text-slate-50 p-4 overflow-x-auto text-xs font-mono rounded-md">
                    {xpathExampleCode}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <div className="text-sm text-slate-500">
          {recordsCount > 0
            ? `جاهز للاستخدام مع ${recordsCount} سجل مخزن`
            : 'قم بمعالجة واستخراج بيانات من الصور أولاً'}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // نسخ الكود إلى الحافظة
              const codeToCopy = advancedMode && customScript 
                ? customScript 
                : targetUrl 
                  ? generateCustomCode() 
                  : seleniumLikeCode;
              
              navigator.clipboard.writeText(codeToCopy);
              alert("تم نسخ الكود إلى الحافظة");
            }}
          >
            نسخ الكود
          </Button>
          
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
        </div>
      </CardFooter>
    </Card>
  );
};

export default SeleniumLikeSection;
