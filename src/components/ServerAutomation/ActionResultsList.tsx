
import React from 'react';
import { ActionResult, AutomationResponse, ErrorType } from '@/utils/automation/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, FileText, Layers, Search, X, Globe, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ActionResultsListProps {
  automationResponse: AutomationResponse | null;
  onHideResults?: () => void;
}

const ActionResultsList: React.FC<ActionResultsListProps> = ({ 
  automationResponse,
  onHideResults
}) => {
  if (!automationResponse) {
    return null;
  }
  
  const { success, message, results, executionTime, error } = automationResponse;
  
  // إضافة وظيفة للتعامل مع أخطاء URL
  const handleURLError = (errorMessage: string) => {
    if (errorMessage.includes("404") || errorMessage.includes("نقطة النهاية API غير موجودة")) {
      return (
        <div className="mt-2 text-sm">
          <p className="font-semibold">حلول مقترحة لمشكلة 404:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>تأكد من أن عنوان URL للمشروع المستهدف صحيح وتم كتابته بشكل كامل مع البروتوكول (https://)</li>
            <li>قد تكون نقطة نهاية API غير صحيحة، تحقق من إعدادات خادم الأتمتة</li>
            <li>تأكد من أن خادم الأتمتة يعمل ولديه نقطة نهاية /api/automation/run</li>
            <li>حاول إضافة www. إلى عنوان URL إذا كان ينقصه</li>
          </ul>
        </div>
      );
    }
    return null;
  };
  
  // إضافة تفاصيل إضافية للمشكلة إذا كانت هناك مشكلة CORS
  const getDetailedErrorInfo = () => {
    if (!error) return null;
    
    let detailedInfo = null;
    
    if (error.type === ErrorType.CORSError) {
      detailedInfo = (
        <div className="mt-2 text-sm">
          <p className="font-semibold">حلول مقترحة لمشاكل CORS:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>تأكد من أن خادم الأتمتة يسمح بالاتصال من نطاقك.</li>
            <li>تحقق من إعدادات متصفحك وتأكد من عدم حظر الطلبات عبر النطاقات.</li>
            <li>جرب استخدام متصفح مختلف.</li>
            <li>تأكد من أن عنوان خادم الأتمتة صحيح.</li>
          </ul>
        </div>
      );
    } else if (error.type === ErrorType.NetworkError) {
      detailedInfo = (
        <div className="mt-2 text-sm">
          <p className="font-semibold">حلول مقترحة لمشاكل الشبكة:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>تأكد من اتصالك بالإنترنت.</li>
            <li>تأكد من أن خادم الأتمتة يعمل.</li>
            <li>تحقق من عنوان خادم الأتمتة.</li>
            <li>قد تكون هناك مشكلة في جدار الحماية أو الشبكة.</li>
          </ul>
        </div>
      );
    } else if (error.type === ErrorType.TimeoutError) {
      detailedInfo = (
        <div className="mt-2 text-sm">
          <p className="font-semibold">حلول مقترحة لمشاكل انتهاء المهلة:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>قد يكون الخادم بطيئًا، حاول مرة أخرى لاحقًا.</li>
            <li>التأكد من أن العمليات المطلوبة ليست معقدة للغاية.</li>
            <li>قد تكون هناك مشكلة في سرعة الإنترنت لديك.</li>
          </ul>
        </div>
      );
    } else if (error.type === ErrorType.StreamReadError) {
      detailedInfo = (
        <div className="mt-2 text-sm">
          <p className="font-semibold">حلول مقترحة لمشاكل قراءة الاستجابة:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>حاول تنفيذ الأتمتة مرة أخرى.</li>
            <li>قد يكون الخادم مشغولاً بطلبات أخرى.</li>
            <li>تأكد من أن خادم الأتمتة يعمل بشكل صحيح.</li>
          </ul>
        </div>
      );
    } else if (error.type === ErrorType.EndpointNotFoundError) {
      detailedInfo = (
        <div className="mt-2 text-sm">
          <p className="font-semibold">حلول مقترحة لمشكلة نقطة النهاية غير موجودة (404):</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>تأكد من أن عنوان URL للخادم صحيح ويحتوي على /api/automation/run</li>
            <li>تحقق من تكوين خادم الأتمتة وتأكد من تنصيب جميع المكونات</li>
            <li>حاول استخدام https:// بدلاً من http:// أو العكس</li>
            <li>تأكد من عدم وجود أحرف زائدة أو ناقصة في العنوان</li>
          </ul>
        </div>
      );
    } else if (error.type === ErrorType.URLError) {
      detailedInfo = (
        <div className="mt-2 text-sm">
          <p className="font-semibold">حلول مقترحة لمشاكل URL:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>تأكد من إدخال URL كامل مع البروتوكول (https:// أو http://)</li>
            <li>تحقق من عدم وجود أخطاء إملائية في العنوان</li>
            <li>تأكد من أن الموقع المستهدف متاح ويمكن الوصول إليه</li>
          </ul>
        </div>
      );
    }
    
    return detailedInfo;
  };
  
  // الحصول على المعلومات الإضافية الخاصة بعناوين URL المستهدفة
  const getTargetURLInfo = () => {
    try {
      if (message && (message.includes("404") || message.includes("نقطة النهاية"))) {
        return (
          <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200">
            <Server className="h-4 w-4 text-amber-600" />
            <AlertTitle>معلومات إضافية عن الخطأ</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="flex flex-col gap-2">
                <div>
                  <p className="font-semibold">رمز الخطأ: 404 (Not Found)</p>
                  <p className="text-sm">هذا يعني أن الخادم لم يتمكن من العثور على نقطة النهاية المطلوبة (api/automation/run).
                   تأكد من أن عنوان URL صحيح وأن الخادم يدعم هذه النقطة.</p>
                </div>
                <div className="mt-2">
                  <p className="font-semibold">إجراءات مقترحة:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                    <li>تحقق من عنوان URL للموقع المستهدف وتأكد من كتابته بشكل صحيح</li>
                    <li>أضف https:// في بداية عنوان URL إذا لم يكن موجوداً</li>
                    <li>تأكد من أن خادم الأتمتة متاح ويعمل بشكل صحيح</li>
                    <li>اختبر الاتصال بالخادم من خلال صفحة إعدادات الخادم</li>
                  </ul>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <Globe className="h-4 w-4 mr-2 text-amber-600" />
                  <span>تلميح: جرب فتح الموقع المستهدف في متصفح منفصل للتأكد من إمكانية الوصول إليه.</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )
      }
    } catch (err) {
      console.error("خطأ في معالجة معلومات URL:", err);
    }
    return null;
  };
  
  return (
    <div className="space-y-4 mt-4">
      <Card className={success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              {success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">نتائج الأتمتة</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">فشل تنفيذ الأتمتة</span>
                </>
              )}
            </CardTitle>
            
            {executionTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{(executionTime / 1000).toFixed(2)} ثانية</span>
              </Badge>
            )}
          </div>
          
          <CardDescription className={success ? "text-green-700" : "text-red-700"}>
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>نوع الخطأ: {error.type || "خطأ غير معروف"}</AlertTitle>
              <AlertDescription className="mt-2 rtl">
                <p>رسالة الخطأ: {error.message}</p>
                {getDetailedErrorInfo()}
                {handleURLError(error.message)}
                {error.stack && (
                  <div className="mt-2">
                    <details>
                      <summary className="font-medium cursor-pointer">تفاصيل الخطأ</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs p-2 bg-red-900/10 rounded-md overflow-x-auto ltr">{error.stack}</pre>
                    </details>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* إضافة معلومات URL المستهدف إذا كانت هناك مشكلة 404 */}
          {getTargetURLInfo()}
          
          {/* إضافة إرشادات خاصة لأخطاء "body stream already read" */}
          {message && message.includes("body stream already read") && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطأ في قراءة استجابة الخادم</AlertTitle>
              <AlertDescription className="mt-2">
                <p>حدث خطأ أثناء محاولة قراءة استجابة الخادم لأكثر من مرة.</p>
                <div className="mt-2 text-sm">
                  <p className="font-semibold">الحلول المقترحة:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>حاول تنفيذ الأتمتة مرة أخرى.</li>
                    <li>إذا استمرت المشكلة، أعد تحميل الصفحة وحاول مرة أخرى.</li>
                    <li>تأكد من عدم الضغط على زر التنفيذ عدة مرات متتالية.</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {results && results.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  <Layers className="h-4 w-4 inline mr-1" />
                  تنفيذ الإجراءات ({results.length}):
                </h3>
                <Badge variant={success ? "success" : "destructive"}>
                  {success ? "تم التنفيذ بنجاح" : "فشل التنفيذ"}
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                {results.map((result: ActionResult) => (
                  <div 
                    key={result.index} 
                    className={`border rounded-md p-3 ${
                      result.success 
                        ? "border-green-200 bg-green-50/50" 
                        : "border-red-200 bg-red-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium flex items-center">
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        {result.index + 1}. {result.action}
                      </h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {result.duration} مللي ثانية
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">المحدد: </span>
                        <code className="text-xs bg-slate-100 px-1 rounded" dir="ltr">{result.selector}</code>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">القيمة: </span>
                        <span>{result.value || <em className="opacity-50">فارغة</em>}</span>
                      </div>
                      
                      {!result.success && result.error && (
                        <div className="mt-1">
                          <span className="text-muted-foreground text-red-700">سبب الفشل: </span>
                          <span className="text-red-700">{result.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            success === false && (
              <div className="text-center py-4">
                <FileText className="h-12 w-12 mx-auto text-red-300 opacity-50 mb-2" />
                <p className="text-red-700">لم يتم تنفيذ أي إجراءات بسبب حدوث خطأ في الاتصال</p>
              </div>
            )
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onHideResults}
          >
            إغلاق النتائج
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ActionResultsList;
