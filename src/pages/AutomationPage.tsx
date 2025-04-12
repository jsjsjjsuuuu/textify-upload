
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
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col">
      <AppHeader />
      
      <div className="container mx-auto p-4 flex-1 content-spacing">
        <div className="mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-[#131b31] text-white/90 hover:bg-[#1a253f] border-0"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="bg-[#0e1529]/95 border-0 rounded-xl">
            <CardHeader className="border-b border-[#1e2a47]">
              <CardTitle className="text-gradient text-2xl">الأتمتة</CardTitle>
              <CardDescription className="text-white/70 text-lg">
                إعداد وتشغيل الأتمتة للمعرف: {imageId}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <Alert className="bg-[#131b31] border-blue-500/20 text-white/90">
                <Info className="h-5 w-5 text-blue-400" />
                <AlertTitle className="text-lg font-medium text-blue-300">هذه صفحة تجريبية</AlertTitle>
                <AlertDescription className="text-white/80 text-base mt-2">
                  ستتم إضافة وظائف الأتمتة الكاملة قريبًا. حاليًا يمكنك العودة إلى الصفحة الرئيسية.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleBack}
                  className="bg-primary hover:bg-primary/90 px-6 py-3 text-base text-black font-medium"
                >
                  العودة إلى الرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <footer className="border-t border-[#1e2a47] py-8 mt-auto bg-[#0e1529]/95">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-base">
              نظام استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AutomationPage;
