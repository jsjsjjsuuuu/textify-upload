
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth';
import { AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';

const ConnectionErrorHandler = () => {
  const { isLoading, isOffline, connectionError, retryConnection } = useAuth();

  const handleRetry = async () => {
    await retryConnection();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="w-[350px] text-center">
          <CardHeader>
            <CardTitle className="flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
              <span>جاري الاتصال...</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              الرجاء الانتظار بينما نحاول الاتصال بالخادم...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="w-[350px]">
          <CardHeader className="text-center pb-2">
            <WifiOff className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>انقطع الاتصال بالإنترنت</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-muted-foreground">
              يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleRetry} className="w-full">
              إعادة المحاولة
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="w-[350px]">
          <CardHeader className="text-center pb-2">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
            <CardTitle>خطأ في الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-muted-foreground">
              {connectionError || 'حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleRetry} className="w-full">
              إعادة المحاولة
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
};

export default ConnectionErrorHandler;
