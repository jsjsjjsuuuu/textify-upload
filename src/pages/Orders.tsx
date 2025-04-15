import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImageData } from '@/types/ImageData';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Filter, RefreshCw, ListFilter } from 'lucide-react';
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
import { Pagination } from '@/components/ui/pagination';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

const Orders: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    loadUserImages,
    images,
    handleTextChange,
  } = useImageProcessing();
  
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    setIsLoading(true);
    loadUserImages((loadedImages) => {
      console.log(`تم تحميل ${loadedImages.length} طلب`);
      const onlyNewImages = loadedImages.filter(img => !img.submitted);
      setFilteredImages(onlyNewImages);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let result = [...filteredImages];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(img => 
        (img.code && img.code.toLowerCase().includes(term)) ||
        (img.senderName && img.senderName.toLowerCase().includes(term)) ||
        (img.phoneNumber && img.phoneNumber.toLowerCase().includes(term))
      );
    }
    
    if (statusFilter !== 'all') {
      // يمكنك إضافة المزيد من شروط التصفية هنا مستقبلاً
      result = result.filter(img => img.status === statusFilter);
    }
    
    setFilteredImages(result);
    setCurrentPage(1);
  }, [images, searchTerm, statusFilter]);

  const stats = {
    total: filteredImages.length,
    new: filteredImages.filter(img => !img.submitted).length,
    processing: filteredImages.filter(img => img.status === 'processing').length,
    completed: filteredImages.filter(img => img.submitted).length
  };

  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const currentImages = filteredImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // إضافة حالة لتتبع ما إذا كان التحديث التلقائي نشطًا
  const [autoUpdate, setAutoUpdate] = useState(false);

  // وظيفة لإنشاء طلب عشوائي جديد
  const createRandomOrder = () => {
    const provinces = ['بغداد', 'البصرة', 'نينوى', 'أربيل', 'كركوك'];
    const phones = ['07701234567', '07801234567', '07901234567'];
    const prices = ['25000', '30000', '45000', '50000'];
    
    const newOrder: ImageData = {
      id: uuidv4(),
      code: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
      phoneNumber: phones[Math.floor(Math.random() * phones.length)],
      province: provinces[Math.floor(Math.random() * provinces.length)],
      price: prices[Math.floor(Math.random() * prices.length)],
      // تخزين التاريخ كـISOString ولكن ملف dateFormatter سيتعامل معه الآن بشكل صحيح
      date: new Date().toISOString(),
      status: 'processing',
      submitted: false
    };
    
    return newOrder;
  };

  // إضافة useEffect للتحديث التلقائي
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoUpdate) {
      interval = setInterval(() => {
        const newOrder = createRandomOrder();
        setFilteredImages(prevImages => [newOrder, ...prevImages]);
      }, 3000); // تحديث كل 3 ثواني
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoUpdate]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen app-background">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center app-background">
        <h2 className="text-xl mb-4">يجب تسجيل الدخول لعرض الطلبات</h2>
        <a href="/login" className="text-blue-500 hover:underline">تسجيل الدخول</a>
      </div>
    );
  }

  // تحديث JSX لإضافة زر التحديث التلقائي
  return (
    <div className="min-h-screen app-background">
      <AppHeader />
      
      <div className="container mx-auto p-4">
        <OrderStats stats={stats} />
        
        <div className="dish-container mb-6">
          <div className="dish-glow-top"></div>
          <div className="dish-glow-bottom"></div>
          <div className="dish-reflection"></div>
          <div className="dish-inner-shadow"></div>
          <div className="relative z-10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gradient">الطلبات الجديدة</h1>
              <div className="flex gap-2 items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setAutoUpdate(!autoUpdate)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    autoUpdate && "text-green-500 hover:text-green-400"
                  )}
                >
                  <RefreshCw 
                    size={20} 
                    className={cn(
                      "transition-all duration-300", 
                      autoUpdate && "animate-spin"
                    )} 
                  />
                </Button>
              </div>
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
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
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
            
            <div className="text-sm text-muted-foreground mb-4">
              تم العثور على {filteredImages.length} طلب
            </div>
          </div>
        </div>
        
        <div className="dish-container">
          <div className="dish-glow-top"></div>
          <div className="dish-glow-bottom"></div>
          <div className="dish-reflection"></div>
          <div className="dish-inner-shadow"></div>
          <div className="relative z-10 p-0">
            {filteredImages.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                لا توجد طلبات جديدة
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">الكود</TableHead>
                      <TableHead>المرسل</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>المحافظة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead className="text-center">التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentImages.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.code || '—'}</TableCell>
                        <TableCell>{order.senderName || '—'}</TableCell>
                        <TableCell>{order.phoneNumber || '—'}</TableCell>
                        <TableCell>{order.province || '—'}</TableCell>
                        <TableCell>{order.price || '—'}</TableCell>
                        <TableCell className="text-center">{formatDate(order.date)}</TableCell>
                        <TableCell>
                          {order.status === 'processing' ? (
                            <Badge variant="outline" className="bg-yellow-100/20 text-yellow-600">
                              قيد المعالجة
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-100/20 text-blue-600">
                              جديد
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="mt-4 p-4 border-t flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
