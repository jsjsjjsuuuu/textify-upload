import React from 'react';
import { Wifi, WifiOff, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// تعديل استيراد useAuth من المسار الصحيح
import { useAuth } from '@/contexts/auth';

/**
 * معالج أخطاء الاتصال الذي يعرض رسائل وإمكانيات إعادة المحاولة للمستخدم.
 */
const ConnectionErrorHandler = () => {
  const { isOffline, connectionError, retryConnection, isLoading } = useAuth();
  
  // إذا لم يكن هناك خطأ في الاتصال أو انقطاع، لا نعرض شيء
  if (!isOffline && !connectionError) {
    return null;
  }
  
  return (
    <div className="fixed top-0 left-0 w-full z-50 p-4">
      <Card className="bg-destructive/90 text-white shadow-md border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            {isOffline ? (
              <>
                <WifiOff className="w-5 h-5" />
                <CardTitle className="text-lg font-semibold">
                  لا يوجد اتصال بالإنترنت
                </CardTitle>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <CardTitle className="text-lg font-semibold">
                  خطأ في الاتصال بالخادم
                </CardTitle>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            {isOffline
              ? "الرجاء التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
              : connectionError || "حدث خطأ غير متوقع أثناء محاولة الاتصال بالخادم."}
          </CardDescription>
        </CardContent>
        <CardFooter className="justify-end">
          <Button 
            variant="secondary"
            onClick={retryConnection}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                إعادة المحاولة...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                إعادة المحاولة
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConnectionErrorHandler;

