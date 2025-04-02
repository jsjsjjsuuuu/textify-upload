
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import ImagePreview from "./ImagePreview";
import ImageDataForm from "./ImageDataForm";
import ImageActions from "./ImageActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Separator } from '@/components/ui/separator';
import { Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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
  
  // تصفية الصور بناءً على showOnlySession
  const filteredImages = showOnlySession
    ? images.filter(img => !img.storage_path) // استخدام storage_path بدلاً من from_db
    : images;
  
  // تجميع الصور حسب الحالة
  const pendingImages = filteredImages.filter(img => img.status === "pending" || !img.status);
  const processingImages = filteredImages.filter(img => img.status === "processing");
  const completedImages = filteredImages.filter(img => img.status === "completed");
  const errorImages = filteredImages.filter(img => img.status === "error");
  
  // دمج المجموعات معًا بترتيب منطقي
  const sortedImages = [
    ...processingImages, // صور قيد المعالجة أولاً
    ...pendingImages,    // ثم الصور المعلقة
    ...completedImages,  // ثم الصور المكتملة
    ...errorImages       // ثم الصور التي بها أخطاء
  ];
  
  return (
    <div className="space-y-6 pb-10">
      {/* حالة المعالجة وأرقام الإحصائيات */}
      <div className="flex flex-wrap gap-2 mb-4">
        {processingImages.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin text-blue-500" />
            جاري المعالجة: {processingImages.length}
          </Badge>
        )}
        {pendingImages.length > 0 && (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="h-3 w-3 mr-1 text-orange-500" />
            معلق: {pendingImages.length}
          </Badge>
        )}
        {completedImages.length > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            مكتمل: {completedImages.length}
          </Badge>
        )}
        {errorImages.length > 0 && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
            خطأ: {errorImages.length}
          </Badge>
        )}
      </div>
      
      {/* تحقق من وجود صور قبل عرض القائمة */}
      {sortedImages.length === 0 ? (
        <div className="text-center p-8 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground">لا توجد صور للعرض</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedImages.map((image) => (
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
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {image.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {image.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        {image.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {image.status === 'completed' ? 'مكتمل' : 
                         image.status === 'processing' ? 'قيد المعالجة' : 
                         image.status === 'error' ? 'خطأ' : 'معلق'}
                      </Badge>
                    </div>
                    <small className="text-muted-foreground text-xs">
                      {formatDate(image.date.toISOString())}
                    </small>
                  </div>
                  
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="w-full mb-2">
                      <TabsTrigger value="preview" className="flex-1">معاينة</TabsTrigger>
                      <TabsTrigger value="data" className="flex-1">البيانات</TabsTrigger>
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
                    // لا تسمح بإعادة المعالجة للصور التي تكون قيد المعالجة أو في حالة الخطأ إذا كانت أكثر من 3 محاولات
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
