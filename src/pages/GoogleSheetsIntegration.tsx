
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackgroundPattern from '@/components/BackgroundPattern';
import AppHeader from '@/components/AppHeader';
import GoogleSheetsConnector from '@/components/GoogleSheets/GoogleSheetsConnector';
import { GoogleSheetsResponse } from '@/utils/automation/types';
import { ArrowRight, FileSpreadsheet, Database, Table } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sampleData = [
  { id: 1, name: 'أحمد محمد', email: 'ahmed@example.com', status: 'نشط' },
  { id: 2, name: 'سارة أحمد', email: 'sara@example.com', status: 'غير نشط' },
  { id: 3, name: 'محمد علي', email: 'mohamed@example.com', status: 'نشط' },
];

const GoogleSheetsIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('connection');
  const [exportResults, setExportResults] = useState<GoogleSheetsResponse[]>([]);
  const navigate = useNavigate();

  const handleExportResponse = (response: GoogleSheetsResponse) => {
    setExportResults(prev => [response, ...prev]);
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />
      
      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />
        
        <div className="mb-8">
          <a href="/" className="flex items-center text-brand-brown hover:text-brand-coral mb-4 transition-colors">
            <ArrowRight className="ml-2" size={16} />
            <span>العودة إلى الرئيسية</span>
          </a>
          
          <div className="flex items-center gap-3 mb-4">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">ربط Google Sheets</h1>
          </div>
          
          <p className="text-muted-foreground max-w-3xl">
            قم بربط تطبيقك مع جداول بيانات Google لتصدير البيانات تلقائيًا أو استيرادها من الجداول. يمكنك إدارة الاتصال وتهيئة إعدادات الربط.
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px] mb-6">
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              الاتصال والإعدادات
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              البيانات والتصدير
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection">
            <div className="grid grid-cols-1 gap-6">
              <GoogleSheetsConnector 
                data={sampleData} 
                onExport={handleExportResponse} 
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>دليل الاستخدام</CardTitle>
                  <CardDescription>كيفية ربط تطبيقك مع Google Sheets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">1. إنشاء جدول بيانات جديد</h3>
                    <p className="text-sm text-muted-foreground">
                      قم بإنشاء جدول بيانات جديد على <a href="https://docs.google.com/spreadsheets/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Sheets</a> أو استخدم جدول موجود بالفعل.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">2. الحصول على معرّف جدول البيانات</h3>
                    <p className="text-sm text-muted-foreground">
                      افتح جدول البيانات وانسخ الرقم الموجود في الرابط بين /d/ و /edit.
                      <br />
                      <span className="text-xs bg-gray-100 p-1 rounded mt-1 inline-block dir-ltr">
                        https://docs.google.com/spreadsheets/d/<strong className="text-red-500">1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</strong>/edit
                      </span>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">3. ضبط إعدادات المشاركة</h3>
                    <p className="text-sm text-muted-foreground">
                      تأكد من مشاركة جدول البيانات مع الجميع مع السماح بالتعديل، أو قم بإضافة حساب الخدمة كمحرر.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="data">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>بيانات للتصدير</CardTitle>
                  <CardDescription>بيانات تجريبية يمكنك تصديرها إلى Google Sheets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr className="text-right">
                          <th className="p-2 border-b">المعرّف</th>
                          <th className="p-2 border-b">الاسم</th>
                          <th className="p-2 border-b">البريد الإلكتروني</th>
                          <th className="p-2 border-b">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleData.map((row) => (
                          <tr key={row.id} className="border-b">
                            <td className="p-2">{row.id}</td>
                            <td className="p-2">{row.name}</td>
                            <td className="p-2 font-mono text-sm" dir="ltr">{row.email}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                row.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4">
                    <GoogleSheetsConnector 
                      data={sampleData}
                      onExport={handleExportResponse}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {exportResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>سجل التصدير</CardTitle>
                    <CardDescription>آخر عمليات تصدير البيانات إلى Google Sheets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {exportResults.map((result, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-md ${
                            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                              {result.success ? 'تم التصدير بنجاح' : 'فشل التصدير'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(result.timestamp).toLocaleString('ar-EG')}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{result.message}</p>
                          {result.spreadsheetUrl && (
                            <a 
                              href={result.spreadsheetUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center mt-2 gap-1"
                            >
                              <FileSpreadsheet className="h-3 w-3" />
                              فتح في Google Sheets
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GoogleSheetsIntegration;
