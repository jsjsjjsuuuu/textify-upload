
import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BookmarkletInstructions: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <AlertTriangle className="h-4 w-4 ml-2 text-amber-600" />
          هام - تأكد من إتمام هذه الخطوات بالترتيب:
        </h3>
        <ol className="text-sm space-y-2 list-decimal list-inside text-amber-700 dark:text-amber-400">
          <li><strong>قم بتصدير البيانات أولاً</strong> في صفحة "تصدير البيانات"</li>
          <li><strong>اسحب</strong> الرابط أدناه إلى شريط الإشارات المرجعية/المفضلة في المتصفح</li>
          <li>انتقل إلى <strong>موقع شركة التوصيل</strong> وسجل الدخول</li>
          <li>انقر على <strong>رابط أداة نقل البيانات</strong> في شريط الإشارات المرجعية</li>
        </ol>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="bookmarklet-instructions">
          <AccordionTrigger className="text-sm font-medium text-blue-800 dark:text-blue-400">
            <div className="flex items-center">
              <Info className="h-4 w-4 ml-2" />
              طريقة إضافة البوكماركلت إلى المتصفح
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-blue-700 dark:text-blue-400">
            <div className="space-y-3">
              <p>إذا واجهتك مشكلة في إضافة البوكماركلت إلى المتصفح، يمكنك اتباع هذه الطرق:</p>
              
              <h4 className="font-semibold mt-2">طريقة السحب والإفلات (الأسهل):</h4>
              <ol className="list-decimal list-inside space-y-1 pr-4">
                <li>قم بسحب زر "أداة نقل البيانات" إلى شريط الإشارات المرجعية في المتصفح</li>
                <li>تأكد من أن شريط الإشارات المرجعية ظاهر (اضغط Ctrl+Shift+B في كروم أو فايرفوكس لإظهاره)</li>
              </ol>
              
              <h4 className="font-semibold mt-2">طريقة النسخ واللصق:</h4>
              <ol className="list-decimal list-inside space-y-1 pr-4">
                <li>انقر على زر "نسخ رابط الأداة" لنسخ رابط البوكماركلت</li>
                <li>انقر بزر الفأرة الأيمن على شريط الإشارات المرجعية واختر "إضافة صفحة..."</li>
                <li>أدخل اسمًا مثل "أداة نقل البيانات"</li>
                <li>الصق الرابط المنسوخ في حقل "الرابط" أو "URL"</li>
                <li>انقر "حفظ" أو "إضافة"</li>
              </ol>
              
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-3 mt-3">
                <h4 className="font-semibold text-red-800 dark:text-red-400 flex items-center">
                  <AlertTriangle className="h-4 w-4 ml-2" />
                  انتبه: لا تنسخ النص كما هو!
                </h4>
                <p className="text-red-700 dark:text-red-400 mt-1">
                  عند نسخ البوكماركلت، تأكد من نسخه كرابط جافاسكريبت وليس كنص عادي. إذا ظهر لك الكود بدلاً من تنفيذه، فهذا يعني أنك نسخت النص العادي بدلاً من الرابط.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="browser-settings">
          <AccordionTrigger className="text-sm font-medium text-amber-800 dark:text-amber-400">
            <div className="flex items-center">
              <Info className="h-4 w-4 ml-2" />
              إعدادات المتصفح المطلوبة لتشغيل البوكماركلت
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-amber-700 dark:text-amber-400">
            <div className="space-y-3">
              <p>إذا واجهتك مشاكل في تشغيل البوكماركلت، تأكد من ضبط الإعدادات التالية في متصفحك:</p>
              
              <h4 className="font-semibold mt-2">في متصفح جوجل كروم:</h4>
              <ol className="list-decimal list-inside space-y-1 pr-4">
                <li>انقر على النقاط الثلاث (⋮) في أعلى يمين المتصفح</li>
                <li>اختر "الإعدادات" ثم "الخصوصية والأمان"</li>
                <li>انتقل إلى "إعدادات المواقع"</li>
                <li>تأكد من تفعيل JavaScript وملفات الكوكيز للموقع المستهدف</li>
                <li>في قسم "النوافذ المنبثقة والإعادة التوجيه"، أضف الموقع المستهدف إلى قائمة "مسموح"</li>
              </ol>
              
              <h4 className="font-semibold mt-2">في متصفح فايرفوكس:</h4>
              <ol className="list-decimal list-inside space-y-1 pr-4">
                <li>انقر على قائمة الثلاث خطوط في أعلى يمين المتصفح</li>
                <li>اختر "الخيارات" ثم "الخصوصية والأمان"</li>
                <li>تأكد من تفعيل "السماح للمواقع بتشغيل JavaScript"</li>
                <li>في قسم "أذونات"، تأكد من السماح بالنوافذ المنبثقة للموقع المستهدف</li>
              </ol>
              
              <h4 className="font-semibold mt-2">ملاحظات هامة:</h4>
              <ul className="list-disc list-inside space-y-1 pr-4">
                <li>قد تحتاج لإعادة تشغيل المتصفح بعد تغيير الإعدادات</li>
                <li>إذا كنت تستخدم وضع التصفح الخاص، فقد لا يعمل البوكماركلت</li>
                <li>البوكماركلت يعمل بشكل أفضل في متصفحات الكمبيوتر وليس الهواتف</li>
                <li>تأكد من أن رابط البوكماركلت يبدأ بـ "javascript:" وليس بنص عادي</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="troubleshooting">
          <AccordionTrigger className="text-sm font-medium text-red-800 dark:text-red-400">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 ml-2" />
              حل المشكلات الشائعة
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-red-700 dark:text-red-400">
            <div className="space-y-3">
              <h4 className="font-semibold">مشكلة: ظهور نص البوكماركلت بدلاً من تنفيذه</h4>
              <p>الحل:</p>
              <ol className="list-decimal list-inside space-y-1 pr-4">
                <li>تأكد من أنك نسخت الرابط بشكل صحيح باستخدام زر "نسخ رابط الأداة"</li>
                <li>تأكد من أن الرابط يبدأ بـ "javascript:" وليس كنص عادي</li>
                <li>جرب طريقة السحب والإفلات بدلاً من النسخ واللصق</li>
                <li>إذا كنت تستخدم الهاتف، جرب استخدام متصفح كمبيوتر بدلاً منه</li>
              </ol>
              
              <h4 className="font-semibold mt-2">مشكلة: البوكماركلت لا يجد الحقول في الموقع المستهدف</h4>
              <p>الحل:</p>
              <ol className="list-decimal list-inside space-y-1 pr-4">
                <li>تأكد من أنك قمت بتصدير البيانات أولاً من التطبيق</li>
                <li>تأكد من أنك على الصفحة الصحيحة في موقع شركة التوصيل</li>
                <li>فتح وحدة تحكم المطور (F12) ومراجعة السجلات لمعرفة المشكلة</li>
                <li>قد تحتاج إلى تعديل محددات HTML في الكود للتوافق مع الموقع المستهدف</li>
              </ol>
              
              <h4 className="font-semibold mt-2">مشكلة: حظر البوكماركلت من قبل المتصفح</h4>
              <p>الحل:</p>
              <ol className="list-decimal list-inside space-y-1 pr-4">
                <li>تأكد من تفعيل JavaScript للموقع المستهدف</li>
                <li>تحقق من أذونات الموقع في إعدادات المتصفح</li>
                <li>قم بإيقاف أي إضافات حظر الإعلانات أو الحماية المشددة مؤقتاً</li>
                <li>قد تحتاج إلى استخدام متصفح آخر إذا استمرت المشكلة</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default BookmarkletInstructions;
