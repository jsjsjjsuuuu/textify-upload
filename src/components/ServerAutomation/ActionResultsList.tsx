
import React from 'react';
import { ActionResult, AutomationResponse } from '@/utils/automation/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, FileText, Layers, Search, X } from 'lucide-react';
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
  
  // إضافة تفاصيل إضافية للمشكلة إذا كانت هناك مشكلة CORS
  const getDetailedErrorInfo = () => {
    if (!error) return null;
    
    let detailedInfo = null;
    
    if (error.type === 'CORSError') {
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
    } else if (error.type === 'NetworkError') {
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
    } else if (error.type === 'TimeoutError') {
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
    }
    
    return detailedInfo;
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
                        <Badge variant="outline" size="sm">
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
