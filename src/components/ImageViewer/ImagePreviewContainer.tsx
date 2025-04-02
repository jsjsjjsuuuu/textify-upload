
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import ImagePreview from "./ImagePreview";
import ImageDataForm from "../ImageList/ImageDataForm";
import ImageActions from "./ImageActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Separator } from '@/components/ui/separator';
import { Clock, AlertCircle, CheckCircle, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onReprocess?: (id: string) => void;
  formatDate?: (date: string) => string;
  showOnlySession?: boolean;
  onImageClick?: (image: ImageData) => void;
}

const ImagePreviewContainer: React.FC<ImagePreviewContainerProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  onReprocess,
  formatDate = (date: string) => new Date(date).toLocaleString(),
  showOnlySession = false,
  onImageClick
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // تصفية الصور بناءً على showOnlySession
  const filteredImages = showOnlySession
    ? images.filter(img => !img.storage_path) // استخدام storage_path بدلاً من from_db
    : images;
  
  // تجميع الصور حسب الحالة
  const pendingImages = filteredImages.filter(img => img.status === "pending" || !img.status);
  const processingImages = filteredImages.filter(img => img.status === "processing");
  const completedImages = filteredImages.filter(img => img.status === "completed");
  const errorImages = filteredImages.filter(img => img.status === "error");
  
  // تصفية الصور حسب الفلتر النشط
  const getFilteredImages = () => {
    switch (activeFilter) {
      case "pending":
        return pendingImages;
      case "processing":
        return processingImages;
      case "completed":
        return completedImages;
      case "error":
        return errorImages;
      default:
        return filteredImages;
    }
  };
  
  // الصور التي سيتم عرضها بعد التصفية
  const imagesToDisplay = getFilteredImages();
  
  return (
    <div className="space-y-6 pb-10">
      {/* فلتر حالة الصور والإحصائيات */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border p-2 flex gap-1 flex-wrap justify-between items-center">
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className="text-xs h-8"
          >
            الكل <Badge className="mr-1 bg-primary/20">{filteredImages.length}</Badge>
          </Button>
          
          <Button
            variant={activeFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("pending")}
            className={`text-xs h-8 ${pendingImages.length > 0 ? "" : "opacity-70"}`}
            disabled={pendingImages.length === 0}
          >
            <Clock className="h-3 w-3 ml-1 text-amber-500" />
            قيد الانتظار <Badge className="mr-1 bg-amber-500/20 text-amber-700">{pendingImages.length}</Badge>
          </Button>
          
          <Button
            variant={activeFilter === "processing" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("processing")}
            className={`text-xs h-8 ${processingImages.length > 0 ? "" : "opacity-70"}`}
            disabled={processingImages.length === 0}
          >
            <Loader2 className="h-3 w-3 ml-1 animate-spin text-blue-500" />
            قيد المعالجة <Badge className="mr-1 bg-blue-500/20 text-blue-700">{processingImages.length}</Badge>
          </Button>
          
          <Button
            variant={activeFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("completed")}
            className={`text-xs h-8 ${completedImages.length > 0 ? "" : "opacity-70"}`}
            disabled={completedImages.length === 0}
          >
            <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
            مكتملة <Badge className="mr-1 bg-green-500/20 text-green-700">{completedImages.length}</Badge>
          </Button>
          
          <Button
            variant={activeFilter === "error" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("error")}
            className={`text-xs h-8 ${errorImages.length > 0 ? "" : "opacity-70"}`}
            disabled={errorImages.length === 0}
          >
            <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
            فشل <Badge className="mr-1 bg-red-500/20 text-red-700">{errorImages.length}</Badge>
          </Button>
        </div>
        
        <Button size="sm" variant="outline" className="text-xs h-8">
          <Filter className="h-3 w-3 ml-1" />
          تحديد الكل
        </Button>
      </div>
      
      {/* عرض الصفحات إذا كان هناك أكثر من 10 صور */}
      {filteredImages.length > 10 && (
        <div className="flex justify-center gap-2 my-4">
          <Button variant="outline" size="sm" className="text-xs h-8">
            السابق
          </Button>
          <Badge variant="outline" className="px-3 py-1.5">
            صفحة 1 من {Math.ceil(filteredImages.length / 10)}
          </Badge>
          <Button variant="outline" size="sm" className="text-xs h-8">
            التالي
          </Button>
        </div>
      )}
      
      {/* تحقق من وجود صور قبل عرض القائمة */}
      {imagesToDisplay.length === 0 ? (
        <div className="text-center p-8 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground">لا توجد صور للعرض ضمن التصفية المحددة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {imagesToDisplay.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {image.submitted && (
                        <Badge variant="default" className="bg-green-600">تم الإرسال</Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`${
                          image.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          image.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          image.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {image.status === 'completed' && <CheckCircle className="h-3 w-3 ml-1" />}
                        {image.status === 'processing' && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
                        {image.status === 'error' && <AlertCircle className="h-3 w-3 ml-1" />}
                        {image.status === 'completed' ? 'مكتمل' : 
                         image.status === 'processing' ? 'قيد المعالجة' : 
                         image.status === 'error' ? 'فشل' : 'معلق'}
                      </Badge>
                    </div>
                    <small className="text-muted-foreground text-xs">
                      {formatDate(image.date.toISOString())}
                    </small>
                  </div>
                  
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="w-full mb-2">
                      <TabsTrigger value="preview" className="flex-1">معاينة</TabsTrigger>
                      <TabsTrigger value="data" className="flex-1">البيانات المستخرجة</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="mt-0">
                      <ImagePreview 
                        image={image} 
                        onImageClick={onImageClick ? () => onImageClick(image) : undefined} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="data" className="mt-0">
                      <div className="max-h-[300px] overflow-y-auto p-1">
                        <ImageDataForm 
                          image={image} 
                          onTextChange={onTextChange} 
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <Separator className="my-2" />
                
                <div className="px-4 pb-4">
                  <ImageActions 
                    imageId={image.id} 
                    status={image.status || "pending"} 
                    isSubmitting={isSubmitting} 
                    submitted={image.submitted} 
                    onDelete={onDelete} 
                    onSubmit={onSubmit}
                    onReprocess={onReprocess}
                    canReprocess={image.status !== "processing" && !(image.status === "error" && image.processingAttempts && image.processingAttempts > 3)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePreviewContainer;
