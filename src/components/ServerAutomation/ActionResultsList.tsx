
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle, AlertCircle, Clock, XSquare, Camera } from "lucide-react";
import { AutomationResponse, AutomationError, ActionResult } from "@/utils/automation/types";

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
          </div>
        </div>
      </div>
    );
  };

  // عرض نتائج الإجراءات
  const renderActionResults = (results?: ActionResult[]) => {
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
                    <span className="font-medium">إجراء {index + 1}: {result.action}</span>
                    <span className="text-sm text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {result.duration}ms
                    </span>
                  </div>
                  
                  <div className="text-sm mt-1">
                    <span className="text-gray-600">المكتشف: </span>
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{result.selector}</code>
                  </div>
                  
                  {result.value && (
                    <div className="text-sm mt-1">
                      <span className="text-gray-600">القيمة: </span>
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{result.value}</code>
                    </div>
                  )}
                  
                  {!result.success && result.error && (
                    <div className="text-sm text-red-600 mt-1">
                      <span>الخطأ: {result.error}</span>
                    </div>
                  )}
                  
                  {result.screenshots && result.screenshots.length > 0 && (
                    <div className="mt-2">
                      <details>
                        <summary className="cursor-pointer text-sm text-blue-600 flex items-center">
                          <Camera className="h-3 w-3 mr-1" />
                          {result.screenshots.length} لقطات شاشة
                        </summary>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {result.screenshots.map((screenshot, idx) => (
                            <a 
                              key={idx} 
                              href={screenshot} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="border border-gray-200 rounded-md overflow-hidden hover:border-blue-300"
                            >
                              <img src={screenshot} alt={`لقطة ${idx + 1}`} className="w-full h-auto" />
                            </a>
                          ))}
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
            {renderActionResults(automationResponse.results)}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActionResultsList;
