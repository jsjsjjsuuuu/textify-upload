
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RENDER_ALLOWED_IPS } from "@/utils/automationServerUrl";

const ConfigurationTips: React.FC = () => {
  return (
    <Card className="mt-8 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">نصائح الاتصال بـ Render</CardTitle>
        <CardDescription>
          معلومات حول كيفية ضمان الاتصال الصحيح بخادم Render
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">عناوين IP الصادرة الثابتة من Render</h3>
          <p className="text-sm mb-2">
            ستأتي طلبات الشبكة من خدمتك إلى الإنترنت العام من أحد عناوين IP التالية. تأكد من أن خادمك مكوّن لقبول هذه العناوين:
          </p>
          <div className="bg-muted p-2 rounded-md">
            <ul className="text-sm font-mono">
              {RENDER_ALLOWED_IPS.map((ip, index) => (
                <li key={index} className="mb-1">{ip}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">إرشادات للاتصال الناجح:</h3>
          <ol className="text-sm space-y-2 list-decimal list-inside mr-4">
            <li>تأكد من أن خادم الأتمتة يعمل ومتاح على الإنترنت.</li>
            <li>إذا كنت تستخدم خادمًا محليًا، تأكد من تشغيله على المنفذ الصحيح (10000).</li>
            <li>لاحظ أن النظام يستخدم تدوير عناوين IP تلقائيًا في حالة فشل الاتصال.</li>
            <li>إذا استمرت مشاكل الاتصال، جرب تعيين عنوان URL مخصص يتجاوز إعدادات CORS.</li>
            <li>تأكد من أن الجدار الناري أو إعدادات الأمان لا تمنع الاتصالات الخارجية.</li>
          </ol>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">لمطوري الخادم:</h3>
          <p className="text-sm">
            يجب أن يتم تكوين خادم الأتمتة للسماح بطلبات CORS وقبول الرؤوس المخصصة 
            <code className="mx-1 px-1 bg-muted rounded">X-Forwarded-For</code>
            و
            <code className="mx-1 px-1 bg-muted rounded">X-Render-Client-IP</code>.
            تأكد من تكوين قواعد الوصول لقبول عناوين IP الصادرة من Render.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationTips;
