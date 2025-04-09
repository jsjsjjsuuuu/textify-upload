import React, { useEffect, useState } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useAuth } from '@/contexts/AuthContext';
import { Loader, Search, Filter, Download, Trash2 } from 'lucide-react';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/utils/dateFormatter';
import { useToast } from '@/hooks/use-toast';
import ImageCardContainer from '@/components/ImageViewer/ImageCardContainer';
import ImageDetailsPanel from '@/components/ImageViewer/ImageDetailsPanel';

const Records = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loadUserImages,
    images,
    handleDelete,
    handleTextChange,
    handleSubmitToApi,
    isSubmitting
  } = useImageProcessing();
  
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // إضافة حالة جديدة لتتبع ما إذا تم تحميل البيانات بالفعل
  const itemsPerPage = 20;
  
  // تحميل صور المستخدم عند تحميل الصفحة - مع تحسين لمنع التحميل المتكرر
  useEffect(() => {
    if (user && !dataLoaded) {
      setIsLoading(true);
      // استدعاء loadUserImages بطريقة صحيحة مع الدالة الرجوعية فقط
      loadUserImages((loadedImages) => {
        console.log(`تم تحميل ${loadedImages.length} صورة للمستخدم`);
        setIsLoading(false);
        setDataLoaded(true); // تعيين حالة التحميل إلى "تم" لمنع إعادة التحميل
        
        // التحقق من وجود معرف في عنوان URL
        const idParam = searchParams.get('id');
        if (idParam) {
          const selectedImage = loadedImages.find(img => img.id === idParam);
          if (selectedImage) {
            setActiveImage(selectedImage);
          }
        }
      });
    }
  }, [user, loadUserImages, searchParams, dataLoaded]); // إضافة dataLoaded إلى مصفوفة التبعيات

  // تصفية الصور بناءً على معايير البحث
  useEffect(() => {
    let result = [...images];
    
    // تطبيق البحث النصي
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(img => 
        (img.code && img.code.toLowerCase().includes(term)) ||
        (img.senderName && img.senderName.toLowerCase().includes(term)) ||
        (img.phoneNumber && img.phoneNumber.includes(term)) ||
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
    
    // ترتيب النتائج (الأحدث أولاً)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredImages(result);
    
    // إعادة تعيين الصفحة الحالية إلى 1 عند تغيير معايير التصفية
    setCurrentPage(1);
  }, [images, searchTerm, statusFilter]);

  // التعامل مع النقر على صورة
  const handleImageClick = (image: ImageData) => {
    setActiveImage(image);
    // تحديث عنوان URL
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

  // حذف الصور المحددة
  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) return;
    
    const confirmed = window.confirm(`هل أنت متأكد من حذف ${selectedImages.length} صورة؟`);
    if (!confirmed) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedImages) {
      try {
        const success = await handleDelete(id);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`خطأ في حذف الصورة ${id}:`, error);
        errorCount++;
      }
    }
    
    // إعادة تعيين قائمة الصور المحددة
    setSelectedImages([]);
    
    // إظهار رسالة نجاح
    toast({
      title: "تم الحذف",
      description: `تم حذف ${successCount} صورة بنجاح${errorCount > 0 ? ` (فشل حذف ${errorCount} صورة)` : ''}`,
    });
    
    // إعادة تحميل الصور - تعديل استدعاء loadUserImages للتوافق مع واجهة التطبيق الجديدة
    if (user) {
      setDataLoaded(false); // إعادة تعيين حالة التحميل لإعادة تحميل البيانات
      loadUserImages((loadedImages) => {
        console.log(`تم إعادة تحميل ${loadedImages.length} صورة بعد الحذف`);
      });
    }
  };

  // تصدير الصور المحددة
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
    
    // تحويل البيانات إلى JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // إنشاء رابط تنزيل
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported_records_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // تنظيف
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast({
      title: "تم التصدير",
      description: `تم تصدير ${selectedImages.length} سجل بنجاح`,
    });
  };

  // حساب الصفحات
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const currentImages = filteredImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // عرض حالة التحميل
  if (isAuthLoading || isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <Loader className="w-8 h-8 animate-spin" />
      <span className="mr-2">جاري تحميل البيانات...</span>
    </div>;
  }

  // التحقق من وجود مستخدم
  if (!user) {
    return <div className="p-8 text-center">
      <h2 className="text-xl mb-4">يجب تسجيل الدخول لعرض السجلات</h2>
      <a href="/login" className="text-blue-500 hover:underline">تسجيل الدخول</a>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">سجلات الصور</h1>
        
        {/* أدوات البحث والتصفية */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث عن كود، اسم، رقم هاتف..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
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
            }}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* أزرار الإجراءات */}
        {selectedImages.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleExportSelected}>
              <Download className="h-4 w-4 mr-2" />
              تصدير ({selectedImages.length})
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              حذف ({selectedImages.length})
            </Button>
          </div>
        )}
        
        {/* عرض عدد النتائج */}
        <div className="text-sm text-muted-foreground mb-4">
          تم العثور على {filteredImages.length} سجل
        </div>
        
        {/* عرض الصور والتفاصيل */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">الصور</h2>
              
              {currentImages.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  لا توجد نتائج مطابقة لمعايير البحث
                </div>
              ) : (
                <ImageCardContainer
                  images={currentImages}
                  activeImage={activeImage}
                  selectedImages={selectedImages}
                  handleImageClick={handleImageClick}
                  setSelectedImages={setSelectedImages}
                  isImageComplete={isImageComplete}
                  hasPhoneError={hasPhoneError}
                />
              )}
              
              {/* ترقيم الصفحات */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {activeImage ? (
              <ImageDetailsPanel
                image={activeImage}
                onTextChange={(id, field, value) => handleTextChange(id, field, value)}
                onSubmit={() => handleSubmitToApi(activeImage.id)}
                onDelete={() => {
                  handleDelete(activeImage.id);
                  setActiveImage(null);
                }}
                isSubmitting={!!isSubmitting[activeImage.id]}
                isComplete={isImageComplete(activeImage)}
                hasPhoneError={hasPhoneError(activeImage)}
              />
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                <p>اختر صورة من القائمة لعرض التفاصيل</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Records;
