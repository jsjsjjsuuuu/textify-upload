
import React, { useState } from 'react';
import { ImageData } from '@/types/ImageData';
import CardItem from '../ImageList/CardItem';
import ImageModal from './ImageModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/EmptyState';
import { ImageIcon, Clock, CheckCircle, XCircle, FilterIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusFilter from '../ImageList/StatusFilter';

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
  onReprocess?: (id: string) => Promise<void>;
}

const ImagePreviewContainer: React.FC<ImagePreviewContainerProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false,
  onReprocess
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // تصفية الصور بناءً على الحالة والبحث
  const filteredImages = images.filter(image => {
    // فلترة حسب النص المبحوث عنه
    const matchesSearch = 
      !searchTerm || 
      (image.code && image.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (image.senderName && image.senderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (image.phoneNumber && image.phoneNumber.includes(searchTerm)) ||
      (image.province && image.province.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // فلترة حسب الحالة
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && image.status === 'completed') ||
      (statusFilter === 'pending' && image.status === 'pending') ||
      (statusFilter === 'processing' && image.status === 'processing') ||
      (statusFilter === 'error' && image.status === 'error') ||
      (statusFilter === 'submitted' && image.submitted === true);
    
    // فلترة حسب علامة التبويب
    let matchesTab = true;
    if (showOnlySession) {
      // في صفحة الجلسة الحالية، تجاهل التبويب
      matchesTab = true;
    } else {
      // في صفحة السجلات، فلتر حسب علامة التبويب
      if (selectedTab === 'submitted') {
        matchesTab = image.submitted === true;
      } else if (selectedTab === 'not-submitted') {
        matchesTab = image.submitted !== true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // ترتيب الصور بحيث تكون الأحدث أولاً
  const sortedImages = [...filteredImages].sort((a, b) => {
    // التحقق من وجود تاريخ created_at لكلا الصورتين
    if (a.created_at && b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (a.created_at) {
      return -1; // a لديها تاريخ ولكن b ليس لديها
    } else if (b.created_at) {
      return 1; // b لديها تاريخ ولكن a ليس لديها
    }
    return 0; // كلاهما ليس لديهما تاريخ
  });

  return (
    <div>
      {/* أدوات البحث والفلترة */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-3 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث حسب الكود، الاسم، الهاتف..."
              className="w-full pl-10 h-10"
            />
            <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className={isFilterOpen ? "bg-primary/10" : ""}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FilterIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {isFilterOpen && (
          <StatusFilter 
            statusFilter={statusFilter} 
            onStatusFilterChange={setStatusFilter} 
          />
        )}
        
        {!showOnlySession && (
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="submitted">تم الإرسال</TabsTrigger>
              <TabsTrigger value="not-submitted">لم يتم الإرسال</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* حالة الفارغة */}
      {sortedImages.length === 0 && (
        <EmptyState
          icon={<ImageIcon className="h-12 w-12 text-muted-foreground" />}
          title="لا توجد صور"
          description={searchTerm || statusFilter !== 'all' ? "لا توجد صور تطابق معايير البحث. جرب تعديل الفلاتر." : "لم يتم تحميل أي صور بعد، يرجى تحميل بعض الصور لبدء استخراج البيانات."}
        />
      )}

      {/* عرض الصور */}
      <div className="space-y-6">
        {sortedImages.map((image) => (
          <CardItem
            key={image.id}
            image={image}
            isSubmitting={isSubmitting}
            onImageClick={setSelectedImage}
            onTextChange={onTextChange}
            onDelete={onDelete}
            onSubmit={onSubmit}
            formatDate={formatDate}
            onReprocess={onReprocess}
          />
        ))}
      </div>

      {/* موديل صورة مكبرة */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          isSubmitting={isSubmitting}
          onClose={() => setSelectedImage(null)}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

export default ImagePreviewContainer;
