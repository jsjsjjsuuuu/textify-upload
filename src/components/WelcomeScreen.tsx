
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { useGeminiProcessing } from '@/hooks/useGeminiProcessing';
import GeminiApiManager from '@/components/GeminiApiManager';
import { toast } from 'sonner';

interface WelcomeScreenProps {
  onClose: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onClose }) => {
  const [showApiManager, setShowApiManager] = useState(false);
  const { testGeminiApiConnection } = useGeminiProcessing();
  
  const handleTestConnection = async () => {
    try {
      toast.loading("جاري اختبار الاتصال...");
      const result = await testGeminiApiConnection();
      if (result) {
        toast.success("تم الاتصال بنجاح مع Gemini API");
        onClose();
      } else {
        toast.error("فشل الاتصال، يرجى التأكد من صحة المفتاح");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/30 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <CardTitle>تجاوز حد استخدام مفتاح Gemini API</CardTitle>
          </div>
          <CardDescription>
            لقد تم تجاوز حصة مفتاح API الافتراضي. يرجى إضافة مفتاح API خاص بك للاستمرار.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 pb-2">
          {showApiManager ? (
            <div className="space-y-4">
              <GeminiApiManager />
              <div className="flex justify-center mt-4">
                <Button onClick={handleTestConnection} className="mx-auto">
                  اختبار الاتصال
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <Key className="h-12 w-12 mx-auto mb-2 text-amber-600" />
                <h3 className="text-lg font-medium">مفتاح API الافتراضي غير متاح حالياً</h3>
                <p className="text-muted-foreground">
                  لقد تم تجاوز حصة مفتاح Gemini API الافتراضي. لحل هذه المشكلة، يرجى إضافة مفتاح API خاص بك.
                </p>
              </div>
              
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                <h4 className="font-medium">كيفية الحصول على مفتاح Gemini API خاص بك:</h4>
                <ol className="list-decimal list-inside space-y-2 rtl:mr-4">
                  <li>قم بزيارة <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1 inline-flex">Google AI Studio <ExternalLink className="h-3 w-3" /></a></li>
                  <li>قم بتسجيل الدخول بحساب Google الخاص بك</li>
                  <li>انقر على "إنشاء مفتاح API" أو "Create API Key"</li>
                  <li>انسخ المفتاح الذي تم إنشاؤه</li>
                  <li>عد إلى هذه الصفحة وألصق المفتاح في النموذج أدناه</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4 bg-slate-50 dark:bg-slate-800/50">
          {!showApiManager ? (
            <>
              <Button variant="outline" onClick={onClose}>
                تخطي
              </Button>
              <Button onClick={() => setShowApiManager(true)}>
                إضافة مفتاح API
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowApiManager(false)}>
                رجوع
              </Button>
              <Button variant="ghost" onClick={onClose}>
                إغلاق
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default WelcomeScreen;
