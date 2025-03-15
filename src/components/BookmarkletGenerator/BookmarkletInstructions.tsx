
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
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default BookmarkletInstructions;
