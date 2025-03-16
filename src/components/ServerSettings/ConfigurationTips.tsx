
import React from "react";
import { RENDER_ALLOWED_IPS } from "@/utils/automationServerUrl";

const ConfigurationTips: React.FC = () => {
  return (
    <div className="mt-8 max-w-2xl mx-auto bg-muted p-4 rounded-md">
      <h3 className="font-semibold mb-2">تلميحات للتكوين:</h3>
      <ul className="space-y-2 list-disc list-inside text-sm">
        <li>للاتصال بخادم محلي، استخدم: <code className="text-xs bg-background px-1 py-0.5 rounded">http://localhost:10000</code></li>
        <li>للاتصال بخادم Render، استخدم: <code className="text-xs bg-background px-1 py-0.5 rounded">https://textify-upload.onrender.com</code></li>
        <li>للتأكد من عمل خادم الأتمتة المحلي، قم بتشغيله باستخدام: <code className="text-xs bg-background px-1 py-0.5 rounded">node src/server/server.js</code></li>
        <li>إذا كان الخادم المحلي يعمل بالفعل، تأكد من أنه يستمع على المنفذ 10000</li>
        <li className="font-semibold text-green-600">يتم الآن محاولة إعادة الاتصال تلقائيًا بخادم Render عند فقدان الاتصال</li>
      </ul>
      
      <div className="mt-4">
        <h4 className="font-semibold mb-2">عناوين IP الصادرة الثابتة من Render:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {RENDER_ALLOWED_IPS.map((ip, index) => (
            <code key={index} className="bg-background px-1 py-0.5 rounded">{ip}</code>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">هذه العناوين مستخدمة في الطلبات للسماح بالوصول من خلال قيود الشبكة.</p>
      </div>
    </div>
  );
};

export default ConfigurationTips;
