import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AutomationResponse, ActionResult } from '@/utils/automation/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Eye, ChevronRight, Clipboard, ScreenShare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActionResultsListProps {
  automationResponse: AutomationResponse;
  onHideResults: () => void;
}

const ActionResultsList: React.FC<ActionResultsListProps> = ({ automationResponse, onHideResults }) => {
  const hasResults = automationResponse && automationResponse.results && automationResponse.results.length > 0;
  const successCount = automationResponse.results ? automationResponse.results.filter(r => r.success).length : 0;
  const errorCount = automationResponse.results ? automationResponse.results.filter(r => !r.success).length : 0;

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            نتائج الأتمتة
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onHideResults}>
            <Eye className="w-4 h-4 mr-2" />
            إخفاء النتائج
          </Button>
        </div>
        <CardDescription>
          تفاصيل تنفيذ الأتمتة ونتائج كل إجراء
        </CardDescription>
      </CardHeader>
      <CardContent>
        {automationResponse ? (
          <div className="space-y-4">
            <Alert className={automationResponse.success ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200"}>
              {automationResponse.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {automationResponse.message}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">ملخص</h4>
                <ul className="list-none space-y-2">
                  <li>
                    <Clock className="h-4 w-4 inline mr-1" />
                    وقت التنفيذ: {automationResponse.executionTime} مللي ثانية
                  </li>
                  <li>
                    <Clipboard className="h-4 w-4 inline mr-1" />
                    نوع الأتمتة: {automationResponse.automationType}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">تفاصيل إضافية</h4>
                {automationResponse.details && automationResponse.details.length > 0 ? (
                  <ul className="list-none space-y-2">
                    {automationResponse.details.map((detail, index) => (
                      <li key={index}>
                        <ChevronRight className="h-4 w-4 inline mr-1" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">لا توجد تفاصيل إضافية</p>
                )}
              </div>
            </div>

            {hasResults ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {automationResponse.results.map((actionResult, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">
                          الإجراء #{actionResult.index + 1}: {actionResult.action}
                        </h5>
                        {actionResult.success ? (
                          <Badge variant="success">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            نجح
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-4 w-4 mr-1" />
                            فشل
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">المحدد:</span> {actionResult.selector}
                        </p>
                        {actionResult.value && (
                          <p className="text-sm">
                            <span className="font-semibold">القيمة:</span> {actionResult.value}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          {actionResult.success ? (
                            <Badge variant="outline">{actionResult.duration} مللي ثانية</Badge>
                          ) : (
                            <Alert variant="destructive" className="bg-red-50 border-red-200">
                              <AlertDescription>
                                {actionResult.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground mb-4">
                  لم يتم العثور على نتائج لتنفيذ الأتمتة
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <ScreenShare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">في انتظار النتائج</h3>
            <p className="text-muted-foreground mb-4">
              سيتم عرض نتائج تنفيذ الأتمتة هنا
            </p>
          </div>
        )}
      </CardContent>
      {hasResults && (
        <CardFooter className="justify-end">
          <div className="space-x-2">
            <Badge variant="secondary">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {successCount} إجراء ناجح
            </Badge>
            <Badge variant="secondary">
              <XCircle className="h-4 w-4 mr-1" />
              {errorCount} إجراء فاشل
            </Badge>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ActionResultsList;
