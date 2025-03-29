
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, RefreshCw, KeyRound } from "lucide-react";
import { converter } from "@/utils/bookmarklet/converter";
import { ImageData } from "@/types/ImageData";
import { saveToLocalStorage } from "@/utils/bookmarklet/storage";
import { Link } from "react-router-dom";
import { useImageProcessingCore } from "@/hooks/useImageProcessingCore";
import ImageUploader from "@/components/ImageUploader";
import ImageList from "@/components/ImageList";
import { useToast } from "@/hooks/use-toast";
import ImageControls from "@/components/ImageControls";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function Index() {
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  const {
    images,
    isProcessing,
    isSubmitting,
    processingProgress,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    loadUserImages,
    removeDuplicates,
    retryProcessing,
    activeUploads,
    queueLength
  } = useImageProcessingCore();
  
  // الحصول على عدد الصور المكتملة
  const completedImages = images.filter(img => 
    img.status === "completed" && img.code && img.senderName && img.phoneNumber
  ).length;
  
  // تنسيق التاريخ بالعربية
  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch (error) {
      return "تاريخ غير صالح";
    }
  };
  
  // وظيفة لمعالجة النقر على الصورة
  const handleImageClick = (id: string) => {
    console.log("تم النقر على الصورة:", id);
    // يمكن إضافة المزيد من المنطق هنا في المستقبل
  };
  
  // وظيفة لتصدير البيانات كـ JSON
  const handleExportJSON = () => {
    try {
      setExportLoading(true);
      
      // استخراج الصور المكتملة فقط
      const validImages = images.filter(img => 
        img.status === "completed" && img.code && img.senderName && img.phoneNumber
      );
      
      if (validImages.length === 0) {
        toast({
          title: "تعذر التصدير",
          description: "لا توجد صور مكتملة للتصدير",
          variant: "destructive"
        });
        return;
      }
      
      // تحويل الصور إلى صيغة قابلة للتصدير
      const items = converter.imagesToBookmarkletItems(validImages);
      
      // تحويل البيانات إلى JSON
      const jsonData = converter.toJSON(items);
      
      // إنشاء وتنزيل الملف
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // تنظيف
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // حفظ البيانات محليًا أيضًا
      saveToLocalStorage(validImages);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${validImages.length} صور بتنسيق JSON`,
      });
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };
  
  // وظيفة لتصدير البيانات كـ CSV
  const handleExportCSV = () => {
    try {
      setExportLoading(true);
      
      // استخراج الصور المكتملة فقط
      const validImages = images.filter(img => 
        img.status === "completed" && img.code && img.senderName && img.phoneNumber
      );
      
      if (validImages.length === 0) {
        toast({
          title: "تعذر التصدير",
          description: "لا توجد صور مكتملة للتصدير",
          variant: "destructive"
        });
        return;
      }
      
      // تحويل الصور إلى صيغة قابلة للتصدير
      const items = converter.imagesToBookmarkletItems(validImages);
      
      // تحويل البيانات إلى CSV
      const csvData = converter.toCSV(items);
      
      // إنشاء وتنزيل الملف
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // تنظيف
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // حفظ البيانات محليًا أيضًا
      saveToLocalStorage(validImages);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${validImages.length} صور بتنسيق CSV`,
      });
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };
  
  // تنظيف التكرارات وإعادة تحميل الصور
  const handleCleanupDuplicates = () => {
    // تنظيف التكرارات
    removeDuplicates();
    
    // إعادة تحميل الصور بعد التنظيف
    setTimeout(() => loadUserImages(), 1000);
    
    toast({
      title: "تم التنظيف",
      description: "تم تنظيف الصور المكررة وإعادة تحميل الصور",
    });
  };
  
  return (
    <div className="container py-4 mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-center">استخراج البيانات من الصور</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader 
            isProcessing={isProcessing} 
            processingProgress={processingProgress} 
            onFileChange={handleFileChange}
            activeUploads={activeUploads}
            queueLength={queueLength}
          />
        </CardContent>
      </Card>
      
      {/* إضافة عناصر التحكم في الصور */}
      <ImageControls 
        totalImages={images.length}
        completedImages={completedImages}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onRefreshImages={loadUserImages}
        onCleanupDuplicates={handleCleanupDuplicates}
      />
      
      {/* معلومات عن معالجة الصور */}
      {isProcessing && processingProgress > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <p className="text-blue-700 dark:text-blue-300 text-center">
            جاري معالجة الصور ({processingProgress}% مكتمل)
            {activeUploads > 0 && <span> - {activeUploads} صورة قيد المعالجة</span>}
            {queueLength > 0 && <span> - {queueLength} صورة في الانتظار</span>}
          </p>
        </div>
      )}
      
      {/* إضافة زر إعادة المحاولة إذا كانت هناك صور في حالة خطأ */}
      {images.some(img => img.status === "error") && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              يوجد {images.filter(img => img.status === "error").length} صورة فشلت في المعالجة
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => retryProcessing()}
              className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 border-yellow-300"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة محاولة معالجة الصور الفاشلة
            </Button>
          </div>
        </div>
      )}
      
      {/* قائمة الصور */}
      <ImageList 
        images={images} 
        onTextChange={handleTextChange} 
        onDelete={handleDelete} 
        onSubmit={handleSubmitToApi}
        isSubmitting={isSubmitting}
        onImageClick={handleImageClick}
        formatDate={formatDate}
      />
      
      {/* رسالة إذا لم تكن هناك صور */}
      {images.length === 0 && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p className="mb-4">لا توجد صور حالياً. قم بتحميل الصور للبدء في استخراج البيانات.</p>
        </div>
      )}
    </div>
  );
}
