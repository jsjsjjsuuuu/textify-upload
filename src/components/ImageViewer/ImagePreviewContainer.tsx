
import { ImageData } from "@/types/ImageData";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreview from "@/components/ImagePreview/ImagePreview";
import { Trash2, Save, SendHorizonal, RotateCcw, Filter, Loader, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
  onReprocess?: (id: string) => Promise<void>;
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
  showOnlySession = false,
  onReprocess
}: ImagePreviewContainerProps) => {
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const { toast } = useToast();
  
  // للمعالجة المباشرة للصور
  const { processWithGemini } = useGeminiProcessing();
  
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
    } else if (images.length === 0) {
      setActiveImage(null);
    }
  }, [images, activeImage]);

  // تصفية الصور حسب علامة التبويب النشطة
  const filteredImages = useCallback(() => {
    let result = [...images];
    
    if (activeTab === "pending") {
      result = result.filter(img => img.status === "pending");
    } else if (activeTab === "completed") {
      result = result.filter(img => img.status === "completed");
    } else if (activeTab === "error") {
      result = result.filter(img => img.status === "error");
    } else if (activeTab === "processing") {
      result = result.filter(img => img.status === "processing");
    }
    
    return result;
  }, [images, activeTab]);

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
  
  // وظيفة لإعادة معالجة الصورة باستخدام Gemini
  const handleReprocess = async () => {
    if (!activeImage) return;
    
    if (onReprocess) {
      // استخدام وظيفة إعادة المعالجة المقدمة من الخارج
      try {
        setIsReprocessing(true);
        await onReprocess(activeImage.id);
        toast({
          title: "تمت إعادة المعالجة",
          description: "تمت إعادة معالجة الصورة بنجاح"
        });
      } catch (error) {
        console.error("خطأ في إعادة معالجة الصورة:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إعادة معالجة الصورة",
          variant: "destructive"
        });
      } finally {
        setIsReprocessing(false);
      }
    } else if (processWithGemini) {
      // استخدام وظيفة المعالجة المباشرة
      try {
        setIsReprocessing(true);
        
        // تحديث حالة الصورة إلى "جاري المعالجة"
        onTextChange(activeImage.id, "status", "processing");
        
        // إعادة معالجة الصورة
        const processedImage = await processWithGemini(activeImage.file, activeImage);
        
        // تحديث بيانات الصورة بالبيانات الجديدة
        for (const [key, value] of Object.entries(processedImage)) {
          if (key !== "id" && key !== "file" && typeof value === "string") {
            onTextChange(activeImage.id, key, value);
          }
        }
        
        // تحديث حالة الصورة
        onTextChange(activeImage.id, "status", processedImage.status);
        
        toast({
          title: "تمت إعادة المعالجة",
          description: "تمت إعادة معالجة الصورة بنجاح"
        });
      } catch (error) {
        console.error("خطأ في إعادة معالجة الصورة:", error);
        
        // تحديث حالة الصورة إلى "خطأ"
        onTextChange(activeImage.id, "status", "error");
        
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إعادة معالجة الصورة",
          variant: "destructive"
        });
      } finally {
        setIsReprocessing(false);
      }
    }
  };

  // إظهار رسالة إذا لم تكن هناك صور
  if (images.length === 0) {
    return (
      <div className="text-center p-10 border-2 border-dashed rounded-xl">
        <h3 className="text-lg font-semibold mb-2">لا توجد صور</h3>
        <p className="text-muted-foreground">قم بتحميل صور ليتم معالجتها واستخراج البيانات منها</p>
      </div>
    );
  }
  
  // عرض الصور في التبويب المحدد
  const renderImagesGrid = () => (
    <div className="grid grid-cols-2 gap-4">
      <AnimatePresence>
        {paginatedImages().map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative overflow-hidden rounded-lg cursor-pointer border-2 transition-all ${
              activeImage?.id === image.id 
                ? "border-primary dark:border-primary shadow-md" 
                : "border-transparent dark:border-transparent"
            } ${
              selectedImages.includes(image.id)
                ? "ring-2 ring-blue-500 dark:ring-blue-400"
                : ""
            }`}
            onClick={() => handleImageClick(image)}
          >
            {/* Checkbox للتحديد المتعدد */}
            <div 
              className="absolute top-2 right-2 z-10 w-5 h-5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImages(prev => 
                  prev.includes(image.id) 
                    ? prev.filter(id => id !== image.id)
                    : [...prev, image.id]
                );
              }}
            >
              {selectedImages.includes(image.id) && (
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              )}
            </div>
            
            {/* حالة الصورة */}
            <div className={`absolute top-2 left-2 z-10 px-1.5 py-0.5 text-xs rounded-full
              ${image.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
              ${image.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" : ""}
              ${image.status === "error" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : ""}
              ${image.status === "processing" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : ""}
            `}>
              {image.status === "completed" && "مكتملة"}
              {image.status === "pending" && "قيد الانتظار"}
              {image.status === "error" && "فشل"}
              {image.status === "processing" && (
                <span className="flex items-center">
                  <Loader className="w-3 h-3 ml-1 animate-spin" />
                  جاري المعالجة
                </span>
              )}
            </div>
            
            {/* صورة مصغرة */}
            <div className="h-28 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              {image.previewUrl ? (
                <img
                  src={image.previewUrl}
                  alt={`صورة ${image.number || ""}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // في حالة فشل تحميل الصورة، استبدالها بأيقونة
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const icon = document.createElement("div");
                      icon.className = "flex items-center justify-center h-full w-full";
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M2 2l20 20"></path><path d="M9 9v0"></path><path d="M6.5 5h11l2 2"></path><path d="M5.5 17.5l1 1"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>';
                      parent.appendChild(icon);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* معلومات الصورة */}
            <div className="p-2 text-xs">
              <p className="font-medium truncate">
                {image.code || image.senderName || `صورة ${image.number || ""}`}
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate">
                {image.file?.name || ""}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
  
  // عرض الصورة النشطة والبيانات
  const renderActiveImage = () => (
    activeImage ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium">
              عرض الصورة والبيانات
            </h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleReprocess}
                disabled={isReprocessing || activeImage.status === "processing"}
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <RotateCcw className={`w-4 h-4 ml-1 ${isReprocessing ? "animate-spin" : ""}`} />
                إعادة معالجة
              </Button>
              
              {activeImage.status === "completed" && !activeImage.submitted && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <SendHorizonal className="w-4 h-4 ml-1" />
                  إرسال
                </Button>
              )}
            </div>
          </div>
          
          <ImagePreview
            image={activeImage}
            onTextChange={onTextChange}
          />
        </div>
      </motion.div>
    ) : (
      <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-8">
        <p className="text-muted-foreground">
          اختر صورة من اليسار لعرض التفاصيل
        </p>
      </div>
    )
  );

  // عرض علامات التبويب وعرض الصور المعالجة
  return (
    <div className="container mx-auto">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <TabsList className="mb-2 md:mb-0">
            <TabsTrigger value="all" className="relative">
              الكل
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                {images.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              قيد الانتظار
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full">
                {images.filter(img => img.status === "pending").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative">
              مكتملة
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                {images.filter(img => img.status === "completed").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="error" className="relative">
              فشل
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                {images.filter(img => img.status === "error").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="processing" className="relative">
              قيد المعالجة
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {images.filter(img => img.status === "processing").length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            {selectedImages.length > 0 ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    // حذف الصور المحددة
                    selectedImages.forEach(id => onDelete(id));
                    setSelectedImages([]);
                    toast({
                      title: "تم الحذف",
                      description: `تم حذف ${selectedImages.length} صور بنجاح`
                    });
                  }}
                  className="ml-2"
                >
                  <Trash2 className="w-4 h-4 ml-1.5" />
                  حذف المحدد ({selectedImages.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedImages([])}
                >
                  إلغاء التحديد
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // تحديد جميع الصور الظاهرة حاليًا
                  setSelectedImages(paginatedImages().map(img => img.id));
                }}
              >
                <Filter className="w-4 h-4 ml-1.5" />
                تحديد الكل
              </Button>
            )}
          </div>
        </div>

        {totalPages > 0 && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-1 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
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
              >
                التالي
              </Button>
            </div>
          </div>
        )}

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* عرض الصور والمعلومات */}
            <div className="order-2 md:order-1">
              {renderImagesGrid()}
            </div>
            
            {/* عرض الصورة النشطة والبيانات المستخرجة */}
            <div className="order-1 md:order-2 mb-6 md:mb-0">
              {renderActiveImage()}
            </div>
          </div>
        </TabsContent>
        
        {/* نفس المحتوى لعلامات التبويب الأخرى */}
        <TabsContent value="pending" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="order-2 md:order-1">
              {renderImagesGrid()}
            </div>
            <div className="order-1 md:order-2 mb-6 md:mb-0">
              {renderActiveImage()}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="order-2 md:order-1">
              {renderImagesGrid()}
            </div>
            <div className="order-1 md:order-2 mb-6 md:mb-0">
              {renderActiveImage()}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="error" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="order-2 md:order-1">
              {renderImagesGrid()}
            </div>
            <div className="order-1 md:order-2 mb-6 md:mb-0">
              {renderActiveImage()}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="processing" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="order-2 md:order-1">
              {renderImagesGrid()}
            </div>
            <div className="order-1 md:order-2 mb-6 md:mb-0">
              {renderActiveImage()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImagePreviewContainer;
