
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";
import BatchExportDialog from "@/components/BatchExportDialog";
import BatchSubmitDialog from "@/components/BatchSubmitDialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Send, Truck, CheckCircle } from "lucide-react";
import { CompanySelector, BatchCompanyAutofill } from "@/components/CompanyAutofill";
import { Badge } from "@/components/ui/badge";

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
  const { toast } = useToast();
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [isBatchSubmitOpen, setIsBatchSubmitOpen] = useState(false);
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);
  const [isBatchAutofillOpen, setIsBatchAutofillOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const handleImageClick = async (image: ImageData) => {
    console.log("Image clicked:", image.id, image.previewUrl);
    // لن يتم عمل أي شيء عند النقر على الصورة - تم إلغاء النافذة المنبثقة
  };

  // احسب عدد الصور التي تم معالجتها بنجاح
  const completedImagesCount = images.filter(img => img.status === "completed").length;
  
  // احسب عدد الصور المؤهلة للإرسال (المكتملة وغير المرسلة)
  const submittableImagesCount = images.filter(img => 
    img.status === "completed" && 
    !img.submitted && 
    (img.phoneNumber ? img.phoneNumber.replace(/[^\d]/g, '').length === 11 : true)
  ).length;

  // معالج اختيار شركة للإدخال الجماعي
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setIsCompanySelectorOpen(false);
    setIsBatchAutofillOpen(true);
  };

  // وظيفة تحديث الصور
  const updateImage = (id: string, fields: Partial<ImageData>) => {
    // ننفذ تحديث الحقول من خلال وظيفة onTextChange لكل حقل
    if (fields.senderName !== undefined) {
      onTextChange(id, 'senderName', fields.senderName);
    }
    if (fields.phoneNumber !== undefined) {
      onTextChange(id, 'phoneNumber', fields.phoneNumber);
    }
    if (fields.province !== undefined) {
      onTextChange(id, 'province', fields.province);
    }
    if (fields.price !== undefined) {
      onTextChange(id, 'price', fields.price);
    }
    if (fields.code !== undefined) {
      onTextChange(id, 'code', fields.code);
    }
    
    // إذا كان هناك نتائج للإدخال التلقائي، نقوم بتحديث الصورة كاملة
    // هذا يتم معالجته في التطبيق الرئيسي
    if (fields.autoFillResult !== undefined) {
      // تحقق من نجاح الإدخال التلقائي
      const latestResult = fields.autoFillResult[fields.autoFillResult.length - 1];
      if (latestResult && latestResult.success) {
        setSuccessCount(prev => prev + 1);
        
        toast({
          title: "تم الإدخال التلقائي بنجاح",
          description: `تم إدخال البيانات بنجاح في شركة ${latestResult.company}`,
          variant: "success",
        });
      }
      
      // إرسال حدث تحديث الصورة
      const event = new CustomEvent('image-update', { 
        detail: {
          id,
          fields: {
            ...fields
          }
        }
      });
      window.dispatchEvent(event);
    }
  };

  // عرض إشعار مستمر عند تراكم نجاحات الإدخال التلقائي
  useEffect(() => {
    if (successCount > 0) {
      const timer = setTimeout(() => {
        setSuccessCount(0);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successCount]);

  return (
    <>
      <div className="grid grid-cols-1 gap-8">
        {successCount > 0 && (
          <div className="fixed bottom-6 left-6 z-50 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300">
            <CheckCircle className="text-green-600 dark:text-green-400" />
            <span>
              تم إدخال <Badge variant="success" className="mx-1">{successCount}</Badge> عنصر بنجاح
            </span>
          </div>
        )}
        
        {(completedImagesCount > 1 || submittableImagesCount > 1) && (
          <div className="flex flex-wrap justify-end gap-2">
            {completedImagesCount > 1 && (
              <Button 
                onClick={() => setIsCompanySelectorOpen(true)} 
                variant="outline"
                className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/20 dark:border-amber-700/30 dark:text-amber-400 dark:hover:bg-amber-900/30 dark:hover:border-amber-700/50"
              >
                <Truck size={16} className="ml-2" />
                إرسال لشركة توصيل ({completedImagesCount} صورة)
              </Button>
            )}
            
            {submittableImagesCount > 1 && (
              <Button 
                onClick={() => setIsBatchSubmitOpen(true)} 
                variant="default"
                className="bg-brand-green hover:bg-brand-green/90"
              >
                <Send size={16} className="ml-2" />
                إرسال دفعة واحدة ({submittableImagesCount} صورة)
              </Button>
            )}
            
            {completedImagesCount > 1 && (
              <Button 
                onClick={() => setIsBatchExportOpen(true)} 
                variant="outline"
                className="bg-brand-coral/10 border-brand-coral/30 text-brand-coral hover:bg-brand-coral/20 hover:border-brand-coral/50"
              >
                <Upload size={16} className="ml-2" />
                تصدير دفعة واحدة ({completedImagesCount} صورة)
              </Button>
            )}
          </div>
        )}

        <ImageList 
          images={images}
          isSubmitting={isSubmitting}
          onImageClick={handleImageClick}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />

        <ImageTable 
          images={images}
          isSubmitting={isSubmitting}
          onImageClick={handleImageClick}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </div>

      <BatchExportDialog 
        isOpen={isBatchExportOpen} 
        onClose={() => setIsBatchExportOpen(false)} 
        images={images}
      />
      
      <BatchSubmitDialog
        isOpen={isBatchSubmitOpen}
        onClose={() => setIsBatchSubmitOpen(false)}
        images={images}
        onSubmit={onSubmit}
      />

      <CompanySelector
        isOpen={isCompanySelectorOpen}
        onClose={() => setIsCompanySelectorOpen(false)}
        onSelectCompany={handleSelectCompany}
      />

      {selectedCompanyId && (
        <BatchCompanyAutofill
          isOpen={isBatchAutofillOpen}
          onClose={() => {
            setIsBatchAutofillOpen(false);
            setSelectedCompanyId(null);
          }}
          images={images}
          updateImage={updateImage}
          companyId={selectedCompanyId}
        />
      )}
    </>
  );
};

export default ImagePreviewContainer;
