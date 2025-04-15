
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImageData } from '@/types/ImageData';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Filter, LayoutGrid, RefreshCw, ListFilter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { formatDate } from '@/utils/dateFormatter';
import OrderStats from '@/components/Orders/OrderStats';
import { Loader } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';

const Orders = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    loadUserImages,
    images,
    isProcessing,
    handleSubmitToApi,
    handleTextChange,
    handleDelete,
    isSubmitting,
  } = useImageProcessing();
  
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 20;

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    if (user && !dataLoaded) {
      loadData();
    }
  }, [user, dataLoaded]);

  const loadData = () => {
    setIsLoading(true);
    loadUserImages((loadedImages) => {
      console.log(`تم تحميل ${loadedImages.length} طلب`);
      setIsLoading(false);
      setDataLoaded(true);
      
      const idParam = searchParams.get('id');
      if (idParam) {
        const selectedImage = loadedImages.find(img => img.id === idParam);
        if (selectedImage) {
          // يمكن إضافة منطق إضافي هنا للتعامل مع الطلب المحدد
        }
      }
    });
  };

  // تصفية الطلبات بناءً على معايير البحث
  useEffect(() => {
    let result = [...images];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(img => 
        (img.code && img.code.toLowerCase().includes(term)) ||
        (img.senderName && img.senderName.toLowerCase().includes(term)) ||
        (img.phoneNumber && img.phoneNumber.toLowerCase().includes(term)) ||
        (img.province && img.province.toLowerCase().includes(term))
      );
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'new') {
        result = result.filter(img => !img.submitted);
      } else if (statusFilter === 'processing') {
        result = result.filter(img => img.status === 'processing');
      } else if (statusFilter === 'completed') {
        result = result.filter(img => img.submitted);
      }
    }
    
    // ترتيب النتائج
    result.sort((a, b) => {
      let fieldA: any;
      let fieldB: any;

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

      return sortDirection === 'asc' ? 
        (fieldA > fieldB ? 1 : -1) : 
        (fieldA < fieldB ? 1 : -1);
    });
    
    setFilteredImages(result);
    setCurrentPage(1);
  }, [images, searchTerm, statusFilter, sortField, sortDirection]);

  // حساب الإحصائيات
  const stats = {
    total: images.length,
    new: images.filter(img => !img.submitted).length,
    processing: images.filter(img => img.status === 'processing').length,
    completed: images.filter(img => img.submitted).length
  };

  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const currentImages = filteredImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isAuthLoading || isLoading) {
    return <div className="flex justify-center items-center h-screen app-background">
      <Loader className="w-8 h-8 animate-spin" />
      <span className="mr-2">جاري تحميل البيانات...</span>
    </div>;
  }

  if (!user) {
    return <div className="p-8 text-center app-background">
      <h2 className="text-xl mb-4">يجب تسجيل الدخول لعرض الطلبات</h2>
      <a href="/login" className="text-blue-500 hover:underline">تسجيل الدخول</a>
    </div>;
  }

  return (
    <div className="min-h-screen app-background">
      <AppHeader />
      
      <div className="container mx-auto p-4">
        {/* إحصائيات الطلبات */}
        <OrderStats stats={stats} />
        
        {/* أدوات البحث والتصفية */}
        <div className="dish-container mb-6">
          <div className="dish-glow-top"></div>
          <div className="dish-glow-bottom"></div>
          <div className="dish-reflection"></div>
          <div className="dish-inner-shadow"></div>
          <div className="relative z-10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gradient">الطلبات</h1>
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
                    <SelectItem value="all">جميع الطلبات</SelectItem>
                    <SelectItem value="new">طلبات جديدة</SelectItem>
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }} className="bg-[#131b31] border-0">
                  <ListFilter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* عرض عدد النتائج */}
            <div className="text-sm text-muted-foreground mb-4">
              تم العثور على {filteredImages.length} طلب
            </div>
          </div>
        </div>
        
        {/* جدول الطلبات */}
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
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-16 font-bold bg-muted/20">#</TableHead>
                      <TableHead className="font-bold bg-muted/20">الكود</TableHead>
                      <TableHead className="font-bold bg-muted/20">المرسل</TableHead>
                      <TableHead className="text-center font-bold bg-muted/20">رقم الهاتف</TableHead>
                      <TableHead className="font-bold bg-muted/20">المحافظة</TableHead>
                      <TableHead className="font-bold bg-muted/20">المبلغ</TableHead>
                      <TableHead className="text-center font-bold bg-muted/20">التاريخ</TableHead>
                      <TableHead className="font-bold bg-muted/20">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentImages.map((order, index) => (
                      <TableRow 
                        key={order.id}
                        className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                          index % 2 === 0 ? 'bg-muted/5' : ''
                        }`}
                        onClick={() => navigate(`/records?id=${order.id}`)}
                      >
                        <TableCell className="font-medium text-center">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="font-semibold">{order.code || '—'}</TableCell>
                        <TableCell>{order.senderName || '—'}</TableCell>
                        <TableCell dir="ltr" className="text-center">{order.phoneNumber || '—'}</TableCell>
                        <TableCell>{order.province || '—'}</TableCell>
                        <TableCell>{order.price || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm text-center">
                          {formatDate(order.date)}
                        </TableCell>
                        <TableCell>
                          {!order.submitted && (
                            <Badge variant="outline" className="bg-blue-100/20 text-blue-600 border-blue-200/30">
                              طلب جديد
                            </Badge>
                          )}
                          {order.status === 'processing' && (
                            <Badge variant="outline" className="bg-yellow-100/20 text-yellow-600 border-yellow-200/30">
                              قيد المعالجة
                            </Badge>
                          )}
                          {order.submitted && (
                            <Badge variant="outline" className="bg-green-100/20 text-green-600 border-green-200/30">
                              مكتمل
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

export default Orders;
