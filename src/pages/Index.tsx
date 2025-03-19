
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Upload, BookOpen, FileText, Settings } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-10" dir="rtl">
      <h1 className="text-3xl font-bold mb-6 text-center">مرحبًا بك في تطبيق تحليل النصوص</h1>
      <p className="text-center text-muted-foreground mb-10">استخدم الأدوات أدناه للوصول إلى الميزات المختلفة للتطبيق</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              معالجة الصور
            </CardTitle>
            <CardDescription>تحميل ومعالجة الصور لاستخراج النص</CardDescription>
          </CardHeader>
          <CardContent>
            <p>قم بتحميل الصور وتحليلها باستخدام تقنيات التعرف الضوئي على الحروف (OCR) للحصول على النص المستخرج.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/')}>فتح معالج الصور</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              أدوات سطر العناوين
            </CardTitle>
            <CardDescription>إنشاء واستخدام أدوات سطر العناوين</CardDescription>
          </CardHeader>
          <CardContent>
            <p>إنشاء أدوات مفيدة لسطر العناوين (Bookmarklet) لتسهيل استخراج البيانات من مواقع الويب المختلفة.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/bookmarklet')}>فتح أدوات سطر العناوين</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              السجلات
            </CardTitle>
            <CardDescription>عرض وإدارة سجلات العمليات</CardDescription>
          </CardHeader>
          <CardContent>
            <p>عرض وإدارة سجلات العمليات السابقة وتحليلات البيانات المستخرجة.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/records')}>فتح السجلات</Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              إعدادات API
            </CardTitle>
            <CardDescription>إعدادات واجهة برمجة التطبيقات</CardDescription>
          </CardHeader>
          <CardContent>
            <p>تكوين وإدارة إعدادات API المستخدمة في التطبيق.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/api-settings')}>فتح إعدادات API</Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-1 border-yellow-500 shadow-md">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
              <Server className="mr-2 h-5 w-5" />
              إعدادات الخادم
            </CardTitle>
            <CardDescription>إعدادات اتصال خادم الأتمتة</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-400">تكوين وإدارة اتصال خادم الأتمتة المستخدم في تحميل الصور ومعالجتها.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700" onClick={() => navigate('/server-settings')}>
              فتح إعدادات الخادم
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
