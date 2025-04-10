
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ImageData } from "@/types/ImageData";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useAuth } from "@/contexts/AuthContext";
import { Loader, Search, Filter, Grid, SortDesc } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/utils/dateFormatter";

const ReceiptGallery: React.FC = () => {
  const { user } = useAuth();
  const {
    loadUserImages,
    images,
    isLoadingUserImages // اكتمال الواجهة لتتضمن isLoadingUserImages
  } = useImageProcessing();
  
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // تحميل الصور عند فتح الصفحة
  useEffect(() => {
    if (user) {
      loadUserImages();
    }
  }, [user, loadUserImages]);
  
  // تصفية وترتيب الصور
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
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        result = result.filter(img => img.status === "completed");
      } else if (statusFilter === "pending") {
        result = result.filter(img => img.status === "pending");
      } else if (statusFilter === "error") {
        result = result.filter(img => img.status === "error");
      } else if (statusFilter === "submitted") {
        result = result.filter(img => img.submitted === true);
      } else if (statusFilter === "not_submitted") {
        result = result.filter(img => img.submitted !== true);
      }
    }
    
    // ترتيب النتائج
    if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOrder === "oldest") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortOrder === "name") {
      result.sort((a, b) => (a.senderName || "").localeCompare(b.senderName || ""));
    } else if (sortOrder === "code") {
      result.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    }
    
    setFilteredImages(result);
    setCurrentPage(1);
  }, [images, searchTerm, statusFilter, sortOrder]);
  
  // التحقق من اكتمال بيانات الصورة
  const isImageComplete = (image: ImageData): boolean => {
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
  const hasPhoneError = (image: ImageData): boolean => {
    return !!image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;
  };
  
  // حساب الصفحات
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const currentImages = filteredImages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // التنقل بين الصفحات
  const pagination = [];
  for (let i = 1; i <= totalPages; i++) {
    pagination.push(
      <Button 
        key={i}
        variant={currentPage === i ? "default" : "outline"}
        size="sm"
        className={currentPage === i ? "bg-purple-700" : "bg-gray-800"}
        onClick={() => setCurrentPage(i)}
      >
        {i}
      </Button>
    );
  }
  
  // عرض شاشة التحميل
  if (isLoadingUserImages) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <AppHeader />
        
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader className="w-8 h-8 animate-spin mb-4" />
          <p>جاري تحميل الوصولات...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppHeader />
      
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">معرض الوصولات</h1>
          <Button asChild className="bg-purple-700 hover:bg-purple-800">
            <Link to="/dashboard">
              <Grid className="h-4 w-4 ml-1" />
              لوحة التحكم
            </Link>
          </Button>
        </div>
        
        {/* أدوات البحث والتصفية */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث عن كود، اسم، رقم هاتف..."
              className="pl-10 bg-gray-900 border-gray-800 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="error">خطأ</SelectItem>
                <SelectItem value="submitted">تم إرسالها</SelectItem>
                <SelectItem value="not_submitted">لم يتم إرسالها</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="newest">الأحدث أولاً</SelectItem>
                <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                <SelectItem value="name">اسم المرسل</SelectItem>
                <SelectItem value="code">الكود</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setSortOrder("newest");
            }} className="bg-gray-900 border-gray-800 hover:bg-gray-800 text-white">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* عرض عدد النتائج */}
        <div className="text-sm text-gray-400 mb-4">
          تم العثور على {filteredImages.length} وصل
        </div>
        
        {/* عرض الوصولات */}
        {currentImages.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <SortDesc className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium mb-2">لا توجد وصولات</h3>
            <p className="text-gray-400">لم يتم العثور على أي وصولات تطابق معايير البحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentImages.map((image) => (
              <Link
                key={image.id}
                to={`/receipt/${image.id}`}
                className="block bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-purple-700 transition-all hover:shadow-lg hover:shadow-purple-900/20 transform hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden bg-black">
                  {image.previewUrl ? (
                    <img
                      src={image.previewUrl}
                      alt={`وصل ${image.code || ""}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-image.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <span className="text-gray-400">لا توجد صورة</span>
                    </div>
                  )}
                  
                  {/* حالة الوصل */}
                  <div className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full
                    ${image.status === "completed" && isImageComplete(image) ? "bg-green-900/80 text-green-200" : ""}
                    ${image.status === "pending" ? "bg-amber-900/80 text-amber-200" : ""}
                    ${image.status === "error" || hasPhoneError(image) ? "bg-red-900/80 text-red-200" : ""}
                    ${image.status === "processing" ? "bg-blue-900/80 text-blue-200" : ""}
                    ${image.status === "completed" && !isImageComplete(image) && !hasPhoneError(image) ? "bg-purple-900/80 text-purple-200" : ""}
                  `}>
                    {image.status === "completed" && isImageComplete(image) && "مكتملة"}
                    {image.status === "pending" && "قيد الانتظار"}
                    {image.status === "error" && "فشل"}
                    {hasPhoneError(image) && "خطأ في رقم الهاتف"}
                    {image.status === "processing" && "جاري المعالجة"}
                    {image.status === "completed" && !isImageComplete(image) && !hasPhoneError(image) && "غير مكتملة"}
                  </div>
                  
                  {/* علامة الإرسال */}
                  {image.submitted && (
                    <div className="absolute top-2 right-2 bg-blue-900/80 text-blue-200 px-2 py-1 text-xs rounded-full">
                      تم الإرسال
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-white truncate">
                    {image.code || `وصل #${image.number || ""}`}
                  </h3>
                  <p className="text-sm text-gray-400 truncate mt-1">
                    {image.senderName || "بدون اسم"}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{image.province || ""}</span>
                    <span>{formatDate(new Date(image.date))}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* ترقيم الصفحات */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-900 border-gray-800 hover:bg-gray-800 text-white"
            >
              السابق
            </Button>
            
            <div className="flex gap-1">
              {pagination}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-gray-900 border-gray-800 hover:bg-gray-800 text-white"
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptGallery;
