
import { useState, useEffect } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Database, Download, PlusSquare, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageData } from '@/types/ImageData';
import { EmptyContent } from '@/components/EmptyContent';

const Records = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("all");
  const { sessionImages, loadUserImages, handleDelete, runCleanupNow } = useImageProcessing();
  const { user } = useAuth();
  const { toast } = useToast();

  // تحميل الصور عند تحميل الصفحة
  useEffect(() => {
    if (user) {
      const load = async () => {
        try {
          await loadUserImages();
          console.log("تم تحميل السجلات بنجاح");
        } catch (error) {
          console.log("فشل في تحميل السجلات", error);
        }
      };
      load();
    }
  }, [user, loadUserImages]);

  // تبديل توسيع الصف
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // حذف سجل
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا السجل؟')) {
      const result = handleDelete(id);
      if (result) {
        toast({
          title: "تم الحذف",
          description: "تم حذف السجل بنجاح",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في حذف السجل",
          variant: "destructive"
        });
      }
    }
  };

  // تنظيف قاعدة البيانات
  const handleCleanup = () => {
    if (user && window.confirm('هل أنت متأكد من رغبتك في تنظيف قاعدة البيانات؟ سيتم حذف السجلات المكررة والقديمة.')) {
      runCleanupNow(user.id);
    }
  };

  // فلترة الصور
  const filteredImages = sessionImages.filter(img => {
    const searchLower = searchTerm.toLowerCase();
    const fieldsToSearch = [
      img.code,
      img.senderName,
      img.phoneNumber,
      img.province,
      img.price,
      img.companyName
    ];
    
    return (
      searchTerm === '' ||
      fieldsToSearch.some(field => field && field.toString().toLowerCase().includes(searchLower))
    );
  });

  // فرز الصور حسب علامة التبويب النشطة
  const getFilteredRecords = () => {
    let records = [...filteredImages];
    
    switch(activeTab) {
      case 'completed':
        records = records.filter(img => img.status === 'completed');
        break;
      case 'pending':
        records = records.filter(img => img.status === 'pending');
        break;
      case 'error':
        records = records.filter(img => img.status === 'error');
        break;
    }
    
    // فرز حسب تاريخ الإنشاء (الأحدث أولاً)
    return records.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const records = getFilteredRecords();

  return (
    <Layout>
      <Header title="سجلات الوصولات" />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="بحث في السجلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCleanup}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              تنظيف
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadUserImages()}
            >
              <RefreshCcw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              الكل
              <Badge variant="outline" className="ml-2">{filteredImages.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              مكتمل
              <Badge variant="outline" className="ml-2">
                {filteredImages.filter(img => img.status === 'completed').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              قيد الانتظار
              <Badge variant="outline" className="ml-2">
                {filteredImages.filter(img => img.status === 'pending').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="error">
              خطأ
              <Badge variant="outline" className="ml-2">
                {filteredImages.filter(img => img.status === 'error').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {records.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الكود</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المرسل</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الهاتف</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المحافظة</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">السعر</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الشركة</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">التاريخ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {records.map((record) => (
                    <>
                      <tr key={record.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpansion(record.id)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {expandedRows.has(record.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{record.code || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{record.senderName || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{record.phoneNumber || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{record.province || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{record.price || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{record.companyName || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {record.created_at ? new Date(record.created_at).toLocaleDateString('ar-AE') : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            record.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            record.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            record.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {record.status === 'completed' ? 'مكتمل' :
                             record.status === 'processing' ? 'قيد المعالجة' :
                             record.status === 'error' ? 'خطأ' : 'قيد الانتظار'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(record.id) && (
                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="text-sm">
                              <h4 className="font-medium mb-2">بيانات إضافية</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">النص المستخرج:</span>
                                  <p className="mt-1 max-h-32 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                                    {record.extractedText || 'لا يوجد نص مستخرج'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">طريقة الاستخراج:</span>
                                  <p className="mt-1">
                                    {record.extractionMethod === 'gemini' ? 'Gemini AI' : 
                                     record.extractionMethod === 'ocr' ? 'OCR' : 'غير معروف'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">نسبة الثقة:</span>
                                  <p className="mt-1">
                                    {record.confidence !== undefined ? `${record.confidence}%` : 'غير متوفر'}
                                  </p>
                                </div>
                                {record.previewUrl && (
                                  <div className="col-span-1 sm:col-span-3">
                                    <span className="text-gray-500 dark:text-gray-400">معاينة:</span>
                                    <div className="mt-1 flex justify-center">
                                      <img 
                                        src={record.previewUrl} 
                                        alt="معاينة الوصل" 
                                        className="max-h-40 object-contain rounded border dark:border-gray-700" 
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyContent
            title="لا توجد سجلات"
            description={
              searchTerm 
                ? "لا توجد نتائج تطابق بحثك. يرجى تجربة مصطلحات بحث مختلفة."
                : "لم يتم العثور على أي سجلات. قم برفع بعض الصور لبدء العمل."
            }
            icon="inbox"
          />
        )}
      </div>
    </Layout>
  );
};

export default Records;
