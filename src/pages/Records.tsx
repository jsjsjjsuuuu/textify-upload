import React, { useEffect, useState } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessingCore'; // تصحيح الاستيراد
import { useAuth } from '@/contexts/AuthContext';
import { Loader, Search, Filter, Download, Trash2, SortAsc, SortDesc, ListFilter, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ImageData } from '@/types/ImageData';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/utils/dateFormatter';
import { useToast } from '@/hooks/use-toast';
import ImageDetailsPanel from '@/components/ImageViewer/ImageDetailsPanel';

const Records = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loadUserImages,
    images,
    handlePermanentDelete,
    handleTextChange,
    handleSubmitToApi,
    isSubmitting,
    unhideAllImages,
    hiddenImageIds
  } = useImageProcessing(); // استخدام اسم الاستيراد الصحيح
  
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 20;
  
  // تحميل صور المستخدم عند تحميل الصفحة
  useEffect(() => {
    if (user && !dataLoaded) {
      loadData();
    }
  }, [user, dataLoaded]);

  // دالة لتحميل البيانات
  const loadData = () => {
    setIsLoading(true);
    
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    loadUserImages(user.id, (loadedImages) => {
      console.log(`تم تحميل ${loadedImages.length} صورة للمستخدم`);
      setIsLoading(false);
      setDataLoaded(true);
      
      // التحقق من وجود معرف في عنوان URL
      const idParam = searchParams.get('id');
      if (idParam) {
        const selectedImage = loadedImages.find(img => img.id === idParam);
        if (selectedImage) {
          setActiveImage(selectedImage);
        }
      }
    });
  };

  // تصفية الصور بناءً على معايير البحث
  useEffect(() => {
    let result = [...images];
    
    // تطبيق البحث النصي
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(img => 
        (img.code && img.code.toLowerCase().includes(term)) ||
        (img.senderName && img.senderName.toLowerCase().includes(term)) ||
        (img.phoneNumber && img.phoneNumber.toLowerCase().includes(term)) ||
        (img.province && img.province.toLowerCase().includes(term))
      );
    }
    
    // تطبيق تصفية الحالة
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        result = result.filter(img => img.status === 'completed');
      } else if (statusFilter === 'pending') {
        result = result.filter(img => img.status === 'pending');
      } else if (statusFilter === 'error') {
        result = result.filter(img => img.status === 'error');
      } else if (statusFilter === 'submitted') {
        result = result.filter(img => img.submitted === true);
      } else if (statusFilter === 'not_submitted') {
        result = result.filter(img => img.submitted !== true);
      }
    }
    
    // ترتيب النتائج
    result.sort((a, b) => {
      let fieldA: any;
      let fieldB: any;

      // تحديد القيم حسب حقل الترتيب
      switch (sortField) {
        case 'code':
          fieldA = a.code || '';
          fieldB = b.code || '';
          break;
        case 'senderName':
          fieldA = a.senderName || '';
          fieldB = b.senderName || '';
          break;
        case 'phoneNumber':
          fieldA = a.phoneNumber || '';
          fieldB = b.phoneNumber || '';
          break;
        case 'province':
          fieldA = a.province || '';
          fieldB = b.province || '';
          break;
        case 'price':
          fieldA = parseFloat(a.price || '0');
          fieldB = parseFloat(b.price || '0');
          break;
        case 'date':
        default:
          fieldA = new Date(a.date).getTime();
          fieldB = new Date(b.date).getTime();
      }

      // تطبيق اتجاه الترتيب
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
    
    setFilteredImages(result);
    setCurrentPage(1);
  }, [images, searchTerm, statusFilter, sortField, sortDirection]);

  // تغيير ترتيب الجدول
  const handleSort = (field: string) => {
    if (sortField === field) {
      // تبديل اتجاه الترتيب إذا كان نفس الحقل
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // تعيين الحقل الجديد واتجاه الترتيب الافتراضي
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // التعامل مع النقر على سجل
  const handleRowClick = (image: ImageData) => {
    setActiveImage(image);
    setSearchParams({ id: image.id });
  };

  // التحقق من اكتمال بيانات الصورة
  const isImageComplete = (image: ImageData) => {
    return !!(
      image.code && 
      image.senderName && 
      image.phoneNumber && 
      image.province && 
      image.price &&
      image.phoneNumber.replace(/[^\d]/g, '').length === 11
    );
  };

  // التحقق من وجود خطأ في رقم الهاتف
  const hasPhoneError = (image: ImageData) => {
    return !!image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;
  };

  // حذف السجلات المحددة
  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) return;
    
    const confirmed = window.confirm(`هل أنت متأكد من حذف ${selectedImages.length} سجل نهائيًا من قاعدة البيانات؟`);
    if (!confirmed) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedImages) {
      try {
        const success = await handlePermanentDelete(id);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`خطأ في حذف السجل ${id}:`, error);
        errorCount++;
      }
    }
    
    setSelectedImages([]);
    
    toast({
      title: "تم الحذف",
      description: `تم حذف ${successCount} سجل بنجاح${errorCount > 0 ? ` (فشل حذف ${errorCount} سجل)` : ''}`,
    });
    
    setDataLoaded(false);
  };

  // تصدير السجلات المحددة
  const handleExportSelected = () => {
    if (selectedImages.length === 0) return;
    
    const selectedData = images.filter(img => selectedImages.includes(img.id));
    const exportData = selectedData.map(img => ({
      code: img.code || '',
      senderName: img.senderName || '',
      phoneNumber: img.phoneNumber || '',
      province: img.province || '',
      price: img.price || '',
      companyName: img.companyName || '',
      date: formatDate(img.date)
    }));
    
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported_records_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast({
      title: "تم التصدير",
      description: `تم تصدير ${selectedImages.length} سجل بنجاح`,
    });
  };

  // تحديد حالة تحديد الكل
  const toggleSelectAll = () => {
    if (selectedImages.length === currentImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(currentImages.map(img => img.id));
    }
  };

  // حساب الصفحات
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const currentImages = filteredImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // عرض حالة التحميل
  if (isAuthLoading || isLoading) {
    return <div className="flex justify-center items-center h-screen app-background">
      <Loader className="w-8 h-8 animate-spin" />
      <span className="mr-2">جاري تحميل البيانات...</span>
    </div>;
  }

  // التحقق من وجود مستخدم
  if (!user) {
    return <div className="p-8 text-center app-background">
      <h2 className="text-xl mb-4">يجب تسجيل الدخول لعرض السجلات</h2>
      <a href="/login" className="text-blue-500 hover:underline">تسجيل الدخول</a>
    </div>;
  }

  // رمز الترتيب
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-3 w-3 mr-1" /> : <SortDesc className="h-3 w-3 mr-1" />;
  };

  return (
    <div className="min-h-screen app-background">
      <AppHeader />
      
      <div className="container mx-auto p-4">
        {/* العنوان والأدوات */}
        <div className="dish-container mb-6">
          <div className="dish-glow-top"></div>
          <div className="dish-glow-bottom"></div>
          <div className="dish-reflection"></div>
          <div className="dish-inner-shadow"></div>
          <div className="relative z-10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gradient">سجلات المعاملات</h1>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setDataLoaded(false);
                  loadData();
                }}
                className="bg-[#131b31] border-0"
              >
                <RefreshCw size={16} className="ml-2" />
                تحديث البيانات
              </Button>
            </div>
            
            {/* أدوات البحث والتصفية */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث عن كود، اسم، رقم هاتف..."
                  className="pl-10 bg-[#131b31] border-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-[#131b31] border-0">
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131b31] border border-[#1e2a47]">
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="error">خطأ</SelectItem>
                    <SelectItem value="submitted">تم إرسالها</SelectItem>
                    <SelectItem value="not_submitted">لم يتم إرسالها</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }} className="bg-[#131b31] border-0">
                  <ListFilter className="h-4 w-4" />
                </Button>
                
                {/* زر إظهار المخفي إذا وجد */}
                {hiddenImageIds?.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => unhideAllImages()} 
                    className="whitespace-nowrap bg-[#131b31] border-0"
                  >
                    إظهار السجلات المخفية ({hiddenImageIds.length})
                  </Button>
                )}
              </div>
            </div>
            
            {/* أزرار الإجراءات */}
            {selectedImages.length > 0 && (
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="bg-[#131b31] border-0" onClick={handleExportSelected}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير ({selectedImages.length})
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف نهائي ({selectedImages.length})
                </Button>
              </div>
            )}
            
            {/* عرض عدد النتائج */}
            <div className="text-sm text-muted-foreground mb-4">
              تم العثور على {filteredImages.length} سجل
            </div>
          </div>
        </div>
        
        {/* عرض الجدول والتفاصيل */}
        <div className="dish-container">
          <div className="dish-glow-top"></div>
          <div className="dish-glow-bottom"></div>
          <div className="dish-reflection"></div>
          <div className="dish-inner-shadow"></div>
          <div className="relative z-10 p-0">
            {filteredImages.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                لا توجد نتائج مطابقة لمعايير البحث
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-[#111827] shadow-md z-10">
                    <TableRow>
                      <TableHead className="text-center w-10">
                        <Checkbox 
                          checked={selectedImages.length === currentImages.length && currentImages.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-center w-16 font-bold bg-muted/20">#</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/30 transition-colors font-bold bg-muted/20"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center">
                          {getSortIcon('code')}
                          الكود
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/30 transition-colors font-bold bg-muted/20"
                        onClick={() => handleSort('senderName')}
                      >
                        <div className="flex items-center">
                          {getSortIcon('senderName')}
                          المرسل
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/30 transition-colors font-bold bg-muted/20"
                        onClick={() => handleSort('phoneNumber')}
                      >
                        <div className="flex items-center">
                          {getSortIcon('phoneNumber')}
                          رقم الهاتف
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/30 transition-colors font-bold bg-muted/20"
                        onClick={() => handleSort('province')}
                      >
                        <div className="flex items-center">
                          {getSortIcon('province')}
                          المحافظة
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/30 transition-colors font-bold bg-muted/20"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center">
                          {getSortIcon('price')}
                          المبلغ
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/30 transition-colors font-bold bg-muted/20"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          {getSortIcon('date')}
                          التاريخ
                        </div>
                      </TableHead>
                      <TableHead className="font-bold bg-muted/20">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentImages.map((image, index) => (
                      <TableRow 
                        key={image.id} 
                        className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-muted/5' : ''} ${activeImage?.id === image.id ? 'bg-muted/50' : ''}`}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedImages.includes(image.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedImages(prev => [...prev, image.id]);
                              } else {
                                setSelectedImages(prev => prev.filter(id => id !== image.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-center">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-semibold">{image.code || '—'}</TableCell>
                        <TableCell>{image.senderName || '—'}</TableCell>
                        <TableCell dir="ltr" className="text-center">{image.phoneNumber || '—'}</TableCell>
                        <TableCell>{image.province || '—'}</TableCell>
                        <TableCell>{image.price || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(image.date)}</TableCell>
                        <TableCell>
                          {image.status === 'completed' && image.submitted && (
                            <Badge variant="outline" className="bg-green-100/20 text-green-600 border-green-200/30">
                              تم الإرسال
                            </Badge>
                          )}
                          {image.status === 'completed' && !image.submitted && (
                            <Badge variant="outline" className="bg-blue-100/20 text-blue-600 border-blue-200/30">
                              مكتملة
                            </Badge>
                          )}
                          {image.status === 'processing' && (
                            <Badge variant="outline" className="bg-yellow-100/20 text-yellow-600 border-yellow-200/30">
                              قيد المعالجة
                            </Badge>
                          )}
                          {image.status === 'error' && (
                            <Badge variant="outline" className="bg-red-100/20 text-red-600 border-red-200/30">
                              خطأ
                            </Badge>
                          )}
                          {image.status === 'pending' && (
                            <Badge variant="outline" className="bg-slate-100/20 text-slate-600 border-slate-200/30">
                              قيد الانتظار
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* ترقيم الصفحات */}
            {totalPages > 1 && (
              <div className="mt-4 p-4 border-t flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Records;
