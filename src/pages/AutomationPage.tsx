
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AutomationPage = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <div className="container mx-auto p-4 flex-1">
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>الأتمتة</CardTitle>
              <CardDescription>
                إعداد وتشغيل الأتمتة للمعرف: {imageId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>هذه صفحة تجريبية</AlertTitle>
                <AlertDescription>
                  ستتم إضافة وظائف الأتمتة الكاملة قريبًا. حاليًا يمكنك العودة إلى الصفحة الرئيسية.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center">
                <Button onClick={handleBack}>
                  العودة إلى الرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              نظام استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AutomationPage;
