
import React from "react";

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
    </div>
  );
};

export default ConfigurationTips;
