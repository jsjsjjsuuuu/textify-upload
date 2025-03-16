
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RENDER_ALLOWED_IPS } from "@/utils/automationServerUrl";
import { AlertTriangle, Server, Shield, Wifi } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ConfigurationTips: React.FC = () => {
  return (
    <Card className="mt-8 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">نصائح الاتصال بـ Render</CardTitle>
        <CardDescription>
          معلومات حول كيفية ضمان الاتصال الصحيح بخادم Render
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive" className="bg-amber-50 border-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">حل مشكلة "Failed to fetch"</AlertTitle>
          <AlertDescription className="text-amber-700">
            إذا كنت تواجه خطأ "Failed to fetch"، فذلك يشير إلى وجود مشكلة في الاتصال بخادم Render. 
            اتبع الإرشادات أدناه لحل المشكلة.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">عناوين IP الصادرة الثابتة من Render</h3>
          </div>
          <p className="text-sm mb-2">
            ستأتي طلبات الشبكة من خدمتك إلى الإنترنت العام من أحد عناوين IP التالية. تأكد من أن خادمك مكوّن لقبول هذه العناوين:
          </p>
          <div className="bg-muted p-3 rounded-md">
            <ul className="text-sm font-mono">
              {RENDER_ALLOWED_IPS.map((ip, index) => (
                <li key={index} className="mb-1">{ip}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">إعدادات CORS المطلوبة في خادم الأتمتة</h3>
          </div>
          <p className="text-sm mb-2">
            يجب تكوين خادم الأتمتة للسماح بطلبات CORS من تطبيقك. تأكد من تثبيت مكتبة cors:
          </p>
          <div className="bg-slate-800 text-white p-3 rounded-md font-mono text-xs overflow-x-auto" dir="ltr">
            <pre>npm install cors</pre>
          </div>
          <p className="text-sm mt-3 mb-2">
            ثم قم بإضافة التكوين التالي في ملف الخادم:
          </p>
          <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto" dir="ltr">
            <pre>{`
// إعدادات CORS المطلوبة
const cors = require('cors');
app.use(cors({
  origin: '*',  // يفضل تحديد نطاقك بدلاً من '*' في الإنتاج
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Forwarded-For', 
    'X-Render-Client-IP'
  ],
  credentials: true,
  maxAge: 86400
}));
            `}</pre>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium">خطوات اختبار الاتصال وحل المشكلات</h3>
          </div>
          <ol className="text-sm space-y-3 list-decimal list-inside mr-4">
            <li className="pb-2 border-b border-gray-100">
              <span className="font-medium">تأكد من تشغيل خادم الأتمتة</span>
              <p className="mt-1 mr-6 text-gray-600">تحقق من أن خادم الأتمتة يعمل ومتاح على الإنترنت. يمكنك التحقق من حالته عن طريق زيارة عنوان URL الخاص به مباشرة في المتصفح.</p>
            </li>
            <li className="pb-2 border-b border-gray-100">
              <span className="font-medium">تحقق من جدار الحماية والشبكة</span>
              <p className="mt-1 mr-6 text-gray-600">تأكد من أن الجدار الناري أو إعدادات الأمان لا تمنع الاتصالات من أو إلى عناوين IP لـ Render المذكورة أعلاه.</p>
            </li>
            <li className="pb-2 border-b border-gray-100">
              <span className="font-medium">اختبر الطلبات باستخدام أداة مثل Postman</span>
              <p className="mt-1 mr-6 text-gray-600">قم بإجراء طلبات اختبار إلى الخادم مع تضمين الرؤوس المطلوبة للتأكد من أنها تعمل بشكل صحيح.</p>
            </li>
            <li className="pb-2 border-b border-gray-100">
              <span className="font-medium">فعّل تدوير عناوين IP</span>
              <p className="mt-1 mr-6 text-gray-600">التطبيق يستخدم آلية تدوير عناوين IP تلقائيًا في حالة فشل الاتصال. تأكد من تفعيل وضع إعادة الاتصال التلقائي.</p>
            </li>
            <li className="pb-2 border-b border-gray-100">
              <span className="font-medium">تحقق من سجلات الخادم</span>
              <p className="mt-1 mr-6 text-gray-600">راجع سجلات خادم الأتمتة للبحث عن أية أخطاء أو مشكلات في معالجة الطلبات.</p>
            </li>
          </ol>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium mb-2">الرؤوس الإضافية المطلوبة:</h3>
          <p className="text-sm">
            يجب إرسال الرؤوس التالية مع كل طلب للخادم:
          </p>
          <div className="bg-muted p-3 rounded-md">
            <ul className="text-sm font-mono space-y-1">
              <li><span className="text-blue-600">X-Forwarded-For</span>: [عنوان IP من قائمة Render]</li>
              <li><span className="text-blue-600">X-Render-Client-IP</span>: [نفس عنوان IP]</li>
              <li><span className="text-blue-600">Origin</span>: [عنوان خادم Render]</li>
              <li><span className="text-blue-600">Referer</span>: [عنوان خادم Render]</li>
              <li><span className="text-blue-600">Access-Control-Allow-Origin</span>: *</li>
            </ul>
          </div>
          <p className="text-sm mt-2">
            هذه الرؤوس تساعد في تجاوز مشكلات CORS وتأكيد هوية الطلب للخادم.
          </p>
        </div>
        
        <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800">إستراتيجية تبديل IP في حالة فشل الاتصال</h3>
          <p className="text-sm text-blue-700">
            في حالة استمرار مشاكل الاتصال، يمكنك تجربة النقاط التالية:
          </p>
          <ul className="text-sm text-blue-700 mr-6 list-disc list-inside space-y-1">
            <li>تأكد من تفعيل خيار إعادة الاتصال التلقائي في صفحة إعدادات الخادم.</li>
            <li>قم بإعادة تشغيل خادم الأتمتة وتحقق من أنه يعمل بشكل صحيح.</li>
            <li>تحقق من إعدادات DNS وقابلية الوصول للخادم.</li>
            <li>تأكد من أن عناوين IP الثابتة لخادم Render مسموح بها في إعدادات الأمان لخادمك.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationTips;
