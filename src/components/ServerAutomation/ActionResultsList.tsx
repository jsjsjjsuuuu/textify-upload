import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle, AlertCircle, Clock, XSquare, Camera } from "lucide-react";
import { AutomationResponse, AutomationError, AutomationActionResult } from "@/utils/automation/types";
import { ErrorType } from "@/utils/automation/types";

// مكون لعرض نتائج الأتمتة
interface ActionResultsListProps {
  automationResponse: AutomationResponse | null;
  onHideResults: () => void;
}

const ActionResultsList: React.FC<ActionResultsListProps> = ({ 
  automationResponse,
  onHideResults
}) => {
  if (!automationResponse) {
    return null;
  }

  // عرض رسالة الخطأ إذا كان هناك خطأ
  const renderError = (error?: AutomationError) => {
    if (!error) return null;
    return (
      <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
          <div>
            <h4 className="font-medium text-red-800">خطأ: {error.type}</h4>
            <p className="text-red-700 mt-1">{error.message}</p>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-600">عرض معلومات التصحيح</summary>
                <pre className="text-xs bg-red-50 p-2 mt-2 overflow-x-auto">{error.stack}</pre>
              </details>
            )}
            {error.details && error.details.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                <h5 className="font-medium">تفاصيل إضافية:</h5>
                <ul className="list-disc list-inside mt-1">
                  {error.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // عرض نتائج الإجراءات
  const renderActionResults = (results?: AutomationActionResult[]) => {
    if (!results || results.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-3">نتائج الإجراءات</h3>
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className={`border rounded-md p-3 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">إجراء {index + 1}: {result.action.name}</span>
                    <span className="text-sm text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : 'غير معروف'}
                    </span>
                  </div>
                  
                  <div className="text-sm mt-1">
                    <span className="text-gray-600">المكتشف: </span>
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{result.action.finder || result.action.selector || ''}</code>
                  </div>
                  
                  {result.action.value && (
                    <div className="text-sm mt-1">
                      <span className="text-gray-600">القيمة: </span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{result.action.value}</code>
                    </div>
                  )}
                  
                  {!result.success && result.error && (
                    <div className="text-sm text-red-600 mt-1">
                      <span>الخطأ: {result.error.message}</span>
                    </div>
                  )}
                  
                  {result.screenshot && (
                    <div className="mt-2">
                      <details>
                        <summary className="cursor-pointer text-sm text-blue-600 flex items-center">
                          <Camera className="h-3 w-3 mr-1" />
                          لقطة شاشة
                        </summary>
                        <div className="mt-2">
                          <a 
                            href={result.screenshot} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="border border-gray-200 rounded-md overflow-hidden hover:border-blue-300 block"
                          >
                            <img src={result.screenshot} alt="لقطة شاشة" className="w-full h-auto" />
                          </a>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // إضافة رسائل مساعدة إضافية بناءً على نوع الخطأ
  const getErrorHelp = (errorType?: string) => {
    if (!errorType) return null;

    const helpMessages: Record<string, React.ReactNode> = {
      'ConnectionError': (
        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-1">اقتراحات لحل مشكلة الاتصال:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 text-blue-700">
            <li>تأكد من أن خادم الأتمتة يعمل ومتاح</li>
            <li>تحقق من عنوان URL في إعدادات الخادم</li>
            <li>قد يكون الخادم في وضع السكون، جرب زيارة عنوان الخادم مباشرة</li>
            <li>تحقق من اتصال الإنترنت الخاص بك</li>
          </ul>
        </div>
      ),
      'TimeoutError': (
        <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200">
          <h4 className="font-medium text-amber-800 mb-1">اقتراحات لحل مشكلة انتهاء المهلة:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 text-amber-700">
            <li>زيادة وقت المهلة في إعدادات الخادم</li>
            <li>تقليل عدد الإجراءات</li>
            <li>تبسيط محددات العناصر</li>
            <li>تحقق من سرعة الاتصال بالإنترنت والتأخير</li>
          </ul>
        </div>
      ),
      'ConfigurationError': (
        <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-1">اقتراحات لحل مشكلة التكوين:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 text-purple-700">
            <li>تحقق من إعدادات الخادم</li>
            <li>تأكد من صحة تكوين الإجراءات والمحددات</li>
            <li>تأكد من أن رابط URL يبدأ بـ http:// أو https://</li>
            <li>تحقق من وجود أي قيود على الخادم المستهدف</li>
          </ul>
        </div>
      ),
      'ValidationError': (
        <div className="mt-3 p-3 bg-orange-50 rounded-md border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-1">اقتراحات لحل مشكلة التحقق:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 text-orange-700">
            <li>تأكد من صحة بيانات الإدخال</li>
            <li>تأكد من عدم وجود أحرف خاصة غير مسموح بها في المحددات</li>
            <li>تأكد من تنسيق URL الصحيح</li>
          </ul>
        </div>
      ),
      'PuppeteerError': (
        <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
          <h4 className="font-medium text-red-800 mb-1">اقتراحات لحل مشكلة المتصفح الآلي:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 text-red-700">
            <li>يبدو أن هناك مشكلة في تشغيل المتصفح على الخادم</li>
            <li>تأكد من تثبيت Chrome أو Chromium على الخادم</li>
            <li>تحقق من إعدادات متغيرات البيئة للخادم</li>
            <li>قد تحتاج إلى ضبط خيارات الأمان للمتصفح الآلي</li>
          </ul>
        </div>
      ),
      'ElementNotFoundError': (
        <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-1">اقتراحات لحل مشكلة عدم العثور على العناصر:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 text-yellow-700">
            <li>تحقق من المحددات المستخدمة للعناصر (CSS selectors)</li>
            <li>قد يكون هيكل الصفحة قد تغير منذ آخر تحديث للسيناريو</li>
            <li>جرب استخدام محددات أكثر استقرارًا (مثل ID بدلاً من Class)</li>
            <li>زيادة مهلة انتظار ظهور العناصر</li>
          </ul>
        </div>
      ),
      'BrowserError': (
        <div className="mt-3 p-3 bg-indigo-50 rounded-md border border-indigo-200">
          <h4 className="font-medium text-indigo-800 mb-1">اقتراحات لحل مشكلة المتصفح:</h4>
          <ul className="list-disc list-inside text-sm space-y-1 text-indigo-700">
            <li>قد تكون هناك مشكلة في تشغيل المتصفح أو التفاعل معه</li>
            <li>حاول تشغيل المتصفح بوضع العرض (--headless)</li>
            <li>تأكد من توفر ذاكرة كافية على الخادم</li>
            <li>تحقق من وجود إصدار حديث من المتصفح</li>
          </ul>
        </div>
      )
    };

    return helpMessages[errorType] || null;
  };

  return (
    <Card className="mt-6">
      <CardHeader className={`pb-2 ${automationResponse.success ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {automationResponse.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XSquare className="h-5 w-5 text-red-500 mr-2" />
              )}
              {automationResponse.success ? 'تم تنفيذ الأتمتة بنجاح' : 'فشل تنفيذ الأتمتة'}
            </CardTitle>
            <CardDescription className="mt-1">
              {automationResponse.message}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onHideResults}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-gray-500 block">نوع الأتمتة:</span>
                <span className="font-medium">{automationResponse.automationType === 'server' ? 'على الخادم' : 'في المتصفح'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-gray-500 block">وقت التنفيذ:</span>
                <span className="font-medium">{automationResponse.executionTime ? `${automationResponse.executionTime}ms` : 'غير متوفر'}</span>
              </div>
            </div>
            
            {automationResponse.details && automationResponse.details.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-sm font-medium mb-2">تفاصيل إضافية:</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {automationResponse.details.map((detail, index) => (
                    <li key={index} className="text-gray-700">{detail}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {renderError(automationResponse.error)}
            {automationResponse.error && getErrorHelp(automationResponse.error.type)}
            {renderActionResults(automationResponse.results)}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// دالة مساعدة لعرض مساعدة لنوع الخطأ
const getErrorHelp = (errorType?: string) => {
  if (!errorType) return null;

  const helpMessages: Record<string, React.ReactNode> = {
    'ConnectionError': (
      <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-1">اقتراحات لحل مشكلة الاتصال:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-blue-700">
          <li>تأكد من أن خادم الأتمتة يعمل ومتاح</li>
          <li>تحقق من عنوان URL في إعدادات الخادم</li>
          <li>قد يكون الخادم في وضع السكون، جرب زيارة عنوان الخادم مباشرة</li>
          <li>تحقق من اتصال الإنترنت الخاص بك</li>
        </ul>
      </div>
    ),
    'TimeoutError': (
      <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200">
        <h4 className="font-medium text-amber-800 mb-1">اقتراحات لحل مشكلة انتهاء المهلة:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-amber-700">
          <li>زيادة وقت المهلة في إعدادات الخادم</li>
          <li>تقليل عدد الإجراءات</li>
          <li>تبسيط محددات العناصر</li>
          <li>تحقق من سرعة الاتصال بالإنترنت والتأخير</li>
        </ul>
      </div>
    ),
    'ConfigurationError': (
      <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-200">
        <h4 className="font-medium text-purple-800 mb-1">اقتراحات لحل مشكلة التكوين:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-purple-700">
          <li>تحقق من إعدادات الخادم</li>
          <li>تأكد من صحة تكوين الإجراءات والمحددات</li>
          <li>تأكد من أن رابط URL يبدأ بـ http:// أو https://</li>
          <li>تحقق من وجود أي قيود على الخادم المستهدف</li>
        </ul>
      </div>
    ),
    'ValidationError': (
      <div className="mt-3 p-3 bg-orange-50 rounded-md border border-orange-200">
        <h4 className="font-medium text-orange-800 mb-1">اقتراحات لحل مشكلة التحقق:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-orange-700">
          <li>تأكد من صحة بيانات الإدخال</li>
          <li>تأكد من عدم وجود أحرف خاصة غير مسموح بها في المحددات</li>
          <li>تأكد من تنسيق URL الصحيح</li>
        </ul>
      </div>
    ),
    'PuppeteerError': (
      <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
        <h4 className="font-medium text-red-800 mb-1">اقتراحات لحل مشكلة المتصفح الآلي:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-red-700">
          <li>يبدو أن هناك مشكلة في تشغيل المتصفح على الخادم</li>
          <li>تأكد من تثبيت Chrome أو Chromium على الخادم</li>
          <li>تحقق من إعدادات متغيرات البيئة للخادم</li>
          <li>قد تحتاج إلى ضبط خيارات الأمان للمتصفح الآلي</li>
        </ul>
      </div>
    ),
    'ElementNotFoundError': (
      <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-1">اقتراحات لحل مشكلة عدم العثور على العناصر:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-yellow-700">
          <li>تحقق من المحددات المستخدمة للعناصر (CSS selectors)</li>
          <li>قد يكون هيكل الصفحة قد تغير منذ آخر تحديث للسيناريو</li>
          <li>جرب استخدام محددات أكثر استقرارًا (مثل ID بدلاً من Class)</li>
          <li>زيادة مهلة انتظار ظهور العناصر</li>
        </ul>
      </div>
    ),
    'BrowserError': (
      <div className="mt-3 p-3 bg-indigo-50 rounded-md border border-indigo-200">
        <h4 className="font-medium text-indigo-800 mb-1">اقتراحات لحل مشكلة المتصفح:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-indigo-700">
          <li>قد تكون هناك مشكلة في تشغيل المتصفح أو التفاعل معه</li>
          <li>حاول تشغيل المتصفح بوضع العرض (--headless)</li>
          <li>تأكد من توفر ذاكرة كافية على الخادم</li>
          <li>تحقق من وجود إصدار حديث من المتصفح</li>
        </ul>
      </div>
    )
  };

  return helpMessages[errorType] || null;
};

export default ActionResultsList;
