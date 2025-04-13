
import { ImageData } from "@/types/ImageData";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Save, SendHorizontal, Filter, Loader, Image, ZoomIn, ZoomOut, RefreshCw, Maximize2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import ExtractedDataEditor from "@/components/ExtractedData/ExtractedDataEditor";
import StatusBadges from "@/components/ImageViewer/StatusBadges";
import { ImageViewer } from "@/components/ImagePreview";
import { Input } from "@/components/ui/input";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
}

// تحديد الحد الأقصى لعدد الصور التي سيتم عرضها في كل مجموعة
const ITEMS_PER_PAGE = 10;

const ImagePreviewContainer = ({
  images,
  isSubmitting = false,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false
}: ImagePreviewContainerProps) => {
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // حالات جديدة لتكبير الصورة
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // تصفية الصور حسب علامة التبويب النشطة
  const filteredImages = useCallback(() => {
    let result = [...images];

    // البحث النصي
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(img => 
        (img.code && img.code.toLowerCase().includes(term)) ||
        (img.senderName && img.senderName.toLowerCase().includes(term)) ||
        (img.phoneNumber && img.phoneNumber.toLowerCase().includes(term)) ||
        (img.province && img.province.toLowerCase().includes(term))
      );
    }

    if (activeTab === "pending") {
      // الصور قيد الانتظار: الصور التي لم تكتمل معالجتها بعد
      result = result.filter(img => img.status === "pending");
    } else if (activeTab === "completed") {
      // الصور المكتملة: الصور التي اكتملت معالجتها وتم ملء البيانات المطلوبة
      result = result.filter(img => img.status === "completed" && isImageComplete(img));
    } else if (activeTab === "error") {
      // الصور التي بها أخطاء: إما أن تكون حالتها "error" أو بها خطأ في رقم الهاتف
      result = result.filter(img => img.status === "error" || hasPhoneError(img));
    } else if (activeTab === "processing") {
      // الصور قيد المعالجة
      result = result.filter(img => img.status === "processing");
    } else if (activeTab === "incomplete") {
      // الصور الغير مكتملة: تمت معالجتها ولكن تنقصها بعض البيانات المطلوبة
      result = result.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img));
    }
    return result;
  }, [images, activeTab, searchTerm]);

  // الاستماع إلى حدث معالجة الصورة لتحديث الصورة النشطة
  useEffect(() => {
    const handleImageProcessed = (event: CustomEvent) => {
      const { imageId } = event.detail;
      const processedImage = images.find(img => img.id === imageId);
      
      if (processedImage) {
        console.log("تم معالجة الصورة وتعيينها كصورة نشطة:", imageId);
        setActiveImage(processedImage);
        
        // إذا كانت الصورة المعالجة في صفحة مختلفة، انتقل إلى الصفحة المناسبة
        const filtered = filteredImages();
        const imageIndex = filtered.findIndex(img => img.id === imageId);
        if (imageIndex >= 0) {
          const page = Math.floor(imageIndex / ITEMS_PER_PAGE) + 1;
          if (page !== currentPage) {
            setCurrentPage(page);
          }
        }
      }
    };

    window.addEventListener('image-processed', handleImageProcessed as EventListener);
    
    return () => {
      window.removeEventListener('image-processed', handleImageProcessed as EventListener);
    };
  }, [images, currentPage, filteredImages]);

  // التحقق مما إذا كانت الصورة مكتملة (لديها البيانات الإلزامية)
  const isImageComplete = useCallback((image: ImageData): boolean => {
    // التحقق من وجود البيانات الأساسية
    const hasRequiredFields = Boolean(image.code) && Boolean(image.senderName) && Boolean(image.province) && Boolean(image.price);

    // التحقق من صحة رقم الهاتف (إما فارغ أو صحيح بطول 11 رقم)
    const hasValidPhone = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
    return hasRequiredFields && hasValidPhone;
  }, []);

  // التحقق مما إذا كانت الصورة تحتوي على خطأ في رقم الهاتف
  const hasPhoneError = useCallback((image: ImageData): boolean => {
    return Boolean(image.phoneNumber) && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;
  }, []);

  // تعيين أول صورة كصورة نشطة تلقائيًا عند التحميل أو عند تغيير الصور
  useEffect(() => {
    if (images.length > 0 && !activeImage) {
      setActiveImage(images[0]);
    } else if (images.length > 0 && activeImage) {
      // تحديث الصورة النشطة إذا تغيرت بياناتها
      const updatedActiveImage = images.find(img => img.id === activeImage.id);
      if (updatedActiveImage && JSON.stringify(updatedActiveImage) !== JSON.stringify(activeImage)) {
        setActiveImage(updatedActiveImage);
      }
      
      // إذا تم حذف الصورة النشطة، حدد صورة أخرى
      if (!updatedActiveImage) {
        setActiveImage(images[0]);
      }
    } else if (images.length === 0) {
      setActiveImage(null);
    }
  }, [images, activeImage]);

  // حساب عدد الصفحات
  const totalPages = Math.ceil(filteredImages().length / ITEMS_PER_PAGE);

  // الحصول على الصور للصفحة الحالية
  const paginatedImages = useCallback(() => {
    const filtered = filteredImages();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredImages, currentPage]);

  // تحديث الصفحة الحالية عند تغيير علامة التبويب
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // وظائف التكبير/التصغير
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // وظيفة التنقل بين الصفحات
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // وظيفة معالجة النقر على الصورة
  const handleImageClick = (image: ImageData) => {
    setActiveImage(image);
  };

  // وظيفة معالجة حذف الصورة
  const handleDelete = () => {
    if (activeImage) {
      onDelete(activeImage.id);

      // تحديث الصورة النشطة بعد الحذف
      const currentImages = filteredImages();
      const currentIndex = currentImages.findIndex(img => img.id === activeImage.id);
      if (currentImages.length > 1) {
        // تعيين الصورة التالية أو السابقة كصورة نشطة
        const nextIndex = Math.min(currentIndex + 1, currentImages.length - 1);
        setActiveImage(currentImages[nextIndex]);
      } else {
        // إذا لم تتبقَّ أي صور، قم بتعيين الصورة النشطة إلى null
        setActiveImage(null);
      }
    }
  };

  // وظيفة معالجة تقديم الصورة
  const handleSubmit = () => {
    if (activeImage) {
      onSubmit(activeImage.id);
    }
  };

  // إظهار رسالة إذا لم تكن هناك صور
  if (images.length === 0) {
    return <div className="text-center p-10 border-2 border-dashed rounded-xl">
        <h3 className="text-lg font-semibold mb-2">لا توجد صور</h3>
        <p className="text-muted-foreground">قم بتحميل صور ليتم معالجتها واستخراج البيانات منها</p>
      </div>;
  }

  // حساب عدد الصور في كل حالة
  const countByStatus = {
    all: images.length,
    pending: images.filter(img => img.status === "pending").length,
    completed: images.filter(img => img.status === "completed" && isImageComplete(img)).length,
    incomplete: images.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img)).length,
    error: images.filter(img => img.status === "error" || hasPhoneError(img)).length,
    processing: images.filter(img => img.status === "processing").length
  };

  // عرض قائمة الصور المصغرة
  const renderImagesThumbnails = () => (
    <div className="grid grid-cols-5 gap-2">
      {paginatedImages().map(image => (
        <motion.div 
          key={image.id} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.2 }} 
          className={`relative overflow-hidden rounded-md cursor-pointer border-2 transition-all ${activeImage?.id === image.id ? "border-primary dark:border-primary shadow-md" : "border-transparent dark:border-transparent"}`}
          onClick={() => handleImageClick(image)}
        >
          <div 
            className={`absolute top-0 left-0 w-full h-1
              ${image.status === "completed" && isImageComplete(image) ? "bg-green-500" : ""}
              ${image.status === "pending" ? "bg-amber-500" : ""}
              ${image.status === "error" || hasPhoneError(image) ? "bg-red-500" : ""}
              ${image.status === "processing" ? "bg-blue-500" : ""}
              ${image.status === "completed" && !isImageComplete(image) && !hasPhoneError(image) ? "bg-purple-500" : ""}
            `}
          ></div>
          
          {/* صورة مصغرة */}
          <div className="h-16 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            {image.previewUrl ? (
              <img 
                src={image.previewUrl} 
                alt={`صورة ${image.number || ""}`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <Image className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );

  // عرض أدوات الصفحات
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center mt-4">
        <div className="flex items-center space-x-1 space-x-reverse">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => goToPage(currentPage - 1)} 
            disabled={currentPage === 1}
            className="glass-button"
          >
            السابق
          </Button>
          
          <span className="px-3 py-1 text-sm">
            صفحة {currentPage} من {totalPages}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => goToPage(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="glass-button"
          >
            التالي
          </Button>
        </div>
      </div>
    );
  };

  // عرض أزرار الإجراءات للصورة النشطة
  const renderImageActions = () => {
    if (!activeImage) return null;
    return (
      <div className="flex justify-end space-x-2 space-x-reverse mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDelete} 
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700"
          title="سيتم إزالة الصورة من العرض فقط دون حذفها من قاعدة البيانات"
        >
          <Trash2 className="w-4 h-4 ml-1" />
          إزالة من العرض
        </Button>
        
        {activeImage.status === "completed" && isImageComplete(activeImage) && !activeImage.submitted && !hasPhoneError(activeImage) && (
          <Button 
            size="sm" 
            variant="default" 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
            إرسال
          </Button>
        )}
      </div>
    );
  };

  // تحديد المخطط الرئيسي باستخدام تصميم زجاجي جديد
  return (
    <div className="container mx-auto">
      {/* شريط التصفية الموحد في الأعلى فقط مع البادجات */}
      <div className="glass-morphism p-6 mb-6 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="glass-blur absolute inset-0"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gradient">معالجة الصور</h2>
            <div className="relative flex-grow max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث عن كود، اسم مرسل، رقم هاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#131b31]/80 backdrop-blur-sm border-0 text-white"
              />
            </div>
          </div>
          
          {/* شريط الفلاتر موحد مع الأيقونات */}
          <StatusBadges
            counts={countByStatus}
            activeFilter={activeTab}
            onFilterChange={setActiveTab}
          />
        </div>
      </div>
      
      {/* عرض الصور المصغرة أعلى الصفحة */}
      <div className="glass-morphism p-4 mb-6 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="glass-blur absolute inset-0"></div>
        <div className="relative z-10">
          {renderImagesThumbnails()}
          {renderPagination()}
        </div>
      </div>
      
      {/* عرض الصورة النشطة والبيانات بجانبها */}
      {activeImage ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* عرض الصورة بحجم كبير */}
          <div className="lg:col-span-7 h-[600px] glass-morphism p-4 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            <div className="glass-blur absolute inset-0"></div>
            <div className="relative z-10 h-full">
              <ImageViewer 
                selectedImage={activeImage}
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onZoomChange={handleZoomChange}
                formatDate={formatDate}
                isFullScreen={isFullScreen}
                onToggleFullScreen={toggleFullScreen}
              />
            </div>
          </div>
          
          {/* عرض البيانات */}
          <div className="lg:col-span-5">
            <div className="glass-morphism p-0 rounded-xl relative overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
              <div className="glass-blur absolute inset-0"></div>
              <div className="relative z-10 h-full">
                <div className="flex justify-between items-center px-4 pt-4">
                  <h2 className="text-lg font-semibold text-gradient">البيانات المستخرجــة</h2>
                  {renderImageActions()}
                </div>
                
                {/* محتوى البيانات */}
                <div className="h-[calc(600px-70px)] overflow-y-auto pr-2 custom-scrollbar">
                  <ExtractedDataEditor image={activeImage} onTextChange={onTextChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-60 flex items-center justify-center glass-morphism p-8 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="glass-blur absolute inset-0"></div>
          <div className="relative z-10">
            <p className="text-muted-foreground">
              اختر صورة لعرض التفاصيل
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewContainer;
