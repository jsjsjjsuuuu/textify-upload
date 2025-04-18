
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, ArrowRight, Settings, RefreshCw } from 'lucide-react';
import { AutomationService } from '@/utils/automationService';
import { toast } from 'sonner';

interface SimpleAutomationSectionProps {
  title?: string;
  description?: string;
}

const SimpleAutomationSection: React.FC<SimpleAutomationSectionProps> = ({
  title = "تشغيل الأتمتة",
  description = "اختر الإجراء الذي ترغب في تنفيذه على النظام"
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  
  const handleRunAutomation = async () => {
    if (!targetUrl) {
      toast.error("الرجاء إدخال عنوان URL هدف صالح");
      return;
    }
    
    setIsRunning(true);
    toast.info("جاري بدء تشغيل الأتمتة...");
    
    try {
      // محاكاة تشغيل الأتمتة
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("تم بدء تشغيل الأتمتة بنجاح");
    } catch (error) {
      console.error("خطأ في تشغيل الأتمتة:", error);
      toast.error("حدث خطأ أثناء محاولة تشغيل الأتمتة");
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="target-url" className="text-sm font-medium mb-1 block">
              عنوان URL الهدف
            </label>
            <Input
              id="target-url"
              placeholder="أدخل عنوان URL الهدف هنا..."
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">إعدادات الأتمتة</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                سيتم تنفيذ الأتمتة على العنوان المحدد
              </li>
              <li className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                الوقت المقدر للتنفيذ: 30-60 ثانية
              </li>
              <li className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                تأكد من أن كل البيانات اللازمة متوفرة قبل البدء
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          الإعدادات
        </Button>
        <Button onClick={handleRunAutomation} disabled={isRunning || !targetUrl} size="sm">
          {isRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4 mr-2" />
          )}
          {isRunning ? "جاري التشغيل..." : "تشغيل الأتمتة"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SimpleAutomationSection;
