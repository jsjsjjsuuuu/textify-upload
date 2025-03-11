
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImagePreviewContainer = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}: ImagePreviewContainerProps) => {
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const { toast } = useToast();

  const handleImageClick = async (image: ImageData) => {
    console.log("Image clicked:", image.id, image.previewUrl);
    // لن يتم عمل أي شيء عند النقر على الصورة - تم إلغاء النافذة المنبثقة
  };

  return (
    <div className="w-full mt-6">
      {images.length > 0 ? (
        <Tabs 
          defaultValue="list" 
          className="w-full" 
          onValueChange={(value) => setViewMode(value as "list" | "table")}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-brand-brown dark:text-brand-beige">الصور المستخرجة ({images.length})</h2>
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="list" className="data-[state=active]:bg-brand-brown data-[state=active]:text-white">عرض القائمة</TabsTrigger>
              <TabsTrigger value="table" className="data-[state=active]:bg-brand-green data-[state=active]:text-white">عرض الجدول</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0">
            <ImageList 
              images={images}
              isSubmitting={isSubmitting}
              onImageClick={handleImageClick}
              onTextChange={onTextChange}
              onDelete={onDelete}
              onSubmit={onSubmit}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="table" className="mt-0">
            <ImageTable 
              images={images}
              isSubmitting={isSubmitting}
              onImageClick={handleImageClick}
              onDelete={onDelete}
              onSubmit={onSubmit}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-muted-foreground">قم برفع صور للبدء في استخراج البيانات</p>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewContainer;
