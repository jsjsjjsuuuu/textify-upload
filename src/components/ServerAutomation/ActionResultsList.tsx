
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AutomationResponse, ErrorType } from '@/utils/automation/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  XCircle, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Globe 
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  
  const { success, message, results, executionTime, error, timestamp } = automationResponse;
  
  // تنسيق وقت التنفيذ
  const formattedTime = timestamp ? formatDistanceToNow(new Date(timestamp), { 
    addSuffix: true, 
    locale: ar 
  }) : '';
  
  // إرشادات الخطأ المحددة بناءً على نوع الخطأ
  const getErrorGuidance = () => {
    if (!error) return null;
    
    switch (error.type) {
      case ErrorType.EndpointNotFoundError:
        return (
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
              مشكلة في نقطة نهاية API
            </h4>
            <p className="text-sm mb-2">
              لم يتم العثور على نقطة نهاية API المطلوبة. يمكن أن يكون ذلك بسبب:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 mr-4">
              <li>تكوين خاطئ لعنوان URL الخادم</li>
              <li>نقطة النهاية API غير متوفرة أو تم تغيير اسمها</li>
              <li>خادم الأتمتة لا يعمل أو غير متاح</li>
            </ul>
            <div className="mt-3 bg-white p-3 rounded border border-amber-100">
              <h5 className="text-sm font-medium mb-1">الحلول المقترحة:</h5>
              <ol className="text-xs list-decimal list-inside space-y-1 mr-4">
                <li>تحقق من إعدادات الخادم في صفحة إعدادات الخادم</li>
                <li>تأكد من أن خادم الأتمتة يعمل ويستجيب</li>
                <li>جرب استخدام نقطة نهاية API أخرى مثل <code className="bg-gray-100 px-1 rounded text-amber-700">/api/automation/execute</code></li>
                <li>راجع مدير النظام للتأكد من صحة تكوين نقاط النهاية API</li>
              </ol>
            </div>
          </div>
        );
      
      case ErrorType.NetworkError:
        return (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Globe className="h-4 w-4 text-blue-600 mr-2" />
              مشكلة في الاتصال بالشبكة
            </h4>
            <p className="text-sm mb-2">
              تعذر الاتصال بخادم الأتمتة. قد يكون ذلك بسبب:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 mr-4">
              <li>مشكلة في اتصال الإنترنت</li>
              <li>خادم الأتمتة غير متاح حاليًا</li>
              <li>جدار الحماية يحظر الاتصال</li>
            </ul>
            <div className="mt-3 bg-white p-3 rounded border border-blue-100">
              <h5 className="text-sm font-medium mb-1">الحلول المقترحة:</h5>
              <ol className="text-xs list-decimal list-inside space-y-1 mr-4">
                <li>تحقق من اتصالك بالإنترنت</li>
                <li>تأكد من أن خادم الأتمتة يعمل</li>
                <li>جرب زيارة الخادم مباشرة للتأكد من أنه متاح</li>
              </ol>
            </div>
          </div>
        );
      
      case ErrorType.CORSError:
        return (
          <div className="bg-purple-50 p-4 rounded-md border border-purple-200 mt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 text-purple-600 mr-2" />
              مشكلة في سياسة CORS
            </h4>
            <p className="text-sm mb-2">
              يوجد خطأ في سياسة مشاركة الموارد عبر الأصول (CORS). هذا يعني أن الخادم لا يسمح بالاتصالات من هذا المصدر.
            </p>
            <div className="mt-3 bg-white p-3 rounded border border-purple-100">
              <h5 className="text-sm font-medium mb-1">الحلول المقترحة:</h5>
              <ol className="text-xs list-decimal list-inside space-y-1 mr-4">
                <li>تأكد من أن الخادم مكون للسماح بطلبات CORS من هذا النطاق</li>
                <li>استخدم خادم وسيط إذا كان ذلك ممكنًا</li>
                <li>اتصل بمدير النظام لتكوين سياسة CORS بشكل صحيح</li>
              </ol>
            </div>
          </div>
        );
      
      case ErrorType.TimeoutError:
        return (
          <div className="bg-orange-50 p-4 rounded-md border border-orange-200 mt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Clock className="h-4 w-4 text-orange-600 mr-2" />
              انتهاء مهلة الاتصال
            </h4>
            <p className="text-sm mb-2">
              استغرق الخادم وقتًا طويلاً للرد، مما أدى إلى انتهاء مهلة الاتصال.
            </p>
            <div className="mt-3 bg-white p-3 rounded border border-orange-100">
              <h5 className="text-sm font-medium mb-1">الحلول المقترحة:</h5>
              <ol className="text-xs list-decimal list-inside space-y-1 mr-4">
                <li>حاول مرة أخرى، قد يكون الخادم مشغولاً</li>
                <li>قلل عدد الإجراءات أو تعقيدها</li>
                <li>تحقق من حالة الخادم ومستوى الحمل عليه</li>
              </ol>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 mt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <XCircle className="h-4 w-4 text-red-600 mr-2" />
              خطأ غير متوقع
            </h4>
            <p className="text-sm mb-2">
              حدث خطأ غير متوقع أثناء تنفيذ الأتمتة. يمكن محاولة:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 mr-4">
              <li>التحقق من إعدادات الخادم</li>
              <li>إعادة المحاولة بعد بضع دقائق</li>
              <li>التحقق من سجلات الخادم للحصول على معلومات أكثر تفصيلاً</li>
            </ul>
          </div>
        );
    }
  };
  
  return (
    <Card>
      <CardHeader className={`${success ? 'bg-green-50' : 'bg-red-50'}`}>
        <CardTitle className="flex items-center gap-2">
          {success ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">تم تنفيذ الأتمتة بنجاح</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">فشل تنفيذ الأتمتة</span>
            </>
          )}
        </CardTitle>
        <CardDescription className={`${success ? 'text-green-700' : 'text-red-700'}`}>
          {message}
          {executionTime && (
            <span className="block mt-1 text-xs">
              وقت التنفيذ: {(executionTime / 1000).toFixed(2)} ثانية
            </span>
          )}
          {timestamp && (
            <span className="block mt-1 text-xs">
              {formattedTime}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && getErrorGuidance()}
        
        {results && results.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3">نتائج الإجراءات:</h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>
                            {result.action} {result.selector && `(${result.selector})`}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.value && `القيمة: ${result.value}`}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.duration && `${result.duration} مللي ثانية`}
                      </div>
                    </div>
                    {result.error && (
                      <div className="mt-2 text-sm text-red-600">
                        <p>الخطأ: {result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onHideResults} variant="secondary">
          إغلاق
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ActionResultsList;
