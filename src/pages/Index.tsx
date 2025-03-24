
import React from 'react';
import { Link } from 'react-router-dom';
import BackgroundPattern from '@/components/BackgroundPattern';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Folder, Upload, Database, FileSpreadsheet, Zap, Server, Cog, CircleCheck } from 'lucide-react';
import { ConnectionStatusIndicator } from '@/components/ui/connection-status-indicator';
import SimpleAutomationSection from '@/components/SimpleAutomationSection';

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <BackgroundPattern />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 relative">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-brand-brown">تحويل النصوص (Textify)</h1>
              <p className="text-muted-foreground max-w-xl">
                استخراج النصوص من الصور والتعرف عليها وتنظيمها بطريقة مبسطة
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatusIndicator />
              
              <Link to="/server-settings">
                <Button variant="outline" size="sm">
                  <Cog className="h-4 w-4 ml-2" />
                  إعدادات الخادم
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Link to="/server-automation" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="ml-2 text-purple-500" />
                  أتمتة الخادم
                </CardTitle>
                <CardDescription>تنفيذ سيناريوهات وعمليات أتمتة من خلال الخادم</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  سيناريوهات أتمتة ويب متقدمة باستخدام الخادم لتنفيذ عمليات متكررة بكفاءة عالية.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-start">
                  <Zap className="h-4 w-4 ml-2" />
                  استخدام الأتمتة
                </Button>
              </CardFooter>
            </Card>
          </Link>
          
          <Link to="/bookmarklet" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="ml-2 text-blue-500" />
                  بوكماركلت
                </CardTitle>
                <CardDescription>أدوات سريعة للمتصفح لاستخراج البيانات وتصديرها</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  إنشاء أدوات مخصصة للمتصفح لاستخراج البيانات من الصفحات وتنظيمها تلقائيًا.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-start">
                  <CircleCheck className="h-4 w-4 ml-2" />
                  إنشاء بوكماركلت
                </Button>
              </CardFooter>
            </Card>
          </Link>
          
          <Link to="/records" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="ml-2 text-amber-500" />
                  السجلات
                </CardTitle>
                <CardDescription>عرض وإدارة السجلات المستخرجة من البيانات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  الوصول إلى جميع البيانات المستخرجة سابقًا وتنظيمها وإدارتها بكفاءة.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-start">
                  <Folder className="h-4 w-4 ml-2" />
                  عرض السجلات
                </Button>
              </CardFooter>
            </Card>
          </Link>
          
          <Link to="/api-settings" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cog className="ml-2 text-gray-500" />
                  إعدادات API
                </CardTitle>
                <CardDescription>تكوين واجهات برمجة التطبيقات والتكامل مع الأنظمة الخارجية</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  إعداد مفاتيح API وإدارة التكامل مع الخدمات الخارجية والأنظمة الأخرى.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-start">
                  <Cog className="h-4 w-4 ml-2" />
                  تكوين API
                </Button>
              </CardFooter>
            </Card>
          </Link>
          
          <Link to="/server-settings" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="ml-2 text-red-500" />
                  إعدادات الخادم
                </CardTitle>
                <CardDescription>تكوين وإدارة الخادم وإعدادات الاتصال</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  تكوين إعدادات الخادم والاتصال ومعايير الأمان وخيارات المزامنة.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-start">
                  <Cog className="h-4 w-4 ml-2" />
                  إدارة الخادم
                </Button>
              </CardFooter>
            </Card>
          </Link>
          
          <Link to="/google-sheets" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-white to-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="ml-2 text-green-600" />
                  ربط Google Sheets
                </CardTitle>
                <CardDescription>تصدير واستيراد البيانات من جداول بيانات Google</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  إنشاء تكامل مباشر مع جداول بيانات Google لتصدير النتائج المستخرجة تلقائيًا.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full justify-start text-green-700">
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  إعداد التكامل
                </Button>
              </CardFooter>
            </Card>
          </Link>
        </div>
        
        <SimpleAutomationSection />
        
        <footer className="text-center py-6 mt-12 text-sm text-muted-foreground">
          <p>تحويل النصوص - إصدار 1.0.2 - جميع الحقوق محفوظة © 2025</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
