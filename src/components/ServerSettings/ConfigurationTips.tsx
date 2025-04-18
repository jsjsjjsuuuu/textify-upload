
import React from 'react';
import { Card } from "@/components/ui/card";
import { ExternalLink } from 'lucide-react';
import { RENDER_ALLOWED_IPS } from '@/utils/automationServerUrl';

const ConfigurationTips = () => {
  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">نصائح للتهيئة</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium">مسموح لعناوين IP:</h4>
          <p className="text-sm text-muted-foreground mb-2">
            إذا كنت تستخدم خدمة Render، يجب السماح لعناوين IP التالية:
          </p>
          <div className="bg-muted p-2 rounded-md">
            <code className="text-xs">{RENDER_ALLOWED_IPS.join(', ')}</code>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium">إعداد قواعد CORS:</h4>
          <p className="text-sm text-muted-foreground">
            تأكد من تكوين CORS للسماح بالوصول من هذا التطبيق. للمزيد من المعلومات، راجع
            <a 
              href="https://docs.render.com/cors"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center hover:underline ml-1"
            >
              وثائق CORS <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </p>
        </div>
        
        <div>
          <h4 className="font-medium">نقاط النهاية API المطلوبة:</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>/api/ping - للتحقق من الاتصال</li>
            <li>/api/process - لمعالجة طلبات الأتمتة</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default ConfigurationTips;
