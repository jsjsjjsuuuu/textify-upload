
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";
import BookmarkletGenerator from "@/components/BookmarkletGenerator";
import { autoFillWebsiteForm } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const CardItem = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate 
}: CardItemProps) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();
  
  const handleExport = (imageId: string) => {
    if (imageId === image.id) {
      setIsBookmarkletOpen(true);
    }
  };

  const handleAutoFill = async () => {
    // عرض مربع حوار لإدخال عنوان URL للموقع
    const url = prompt("أدخل عنوان URL للموقع الذي تريد ملء البيانات فيه:", "https://");
    if (!url) return;
    
    setWebsiteUrl(url);
    setIsAutoFilling(true);
    
    try {
      // إعداد البيانات للإرسال
      const formData = {
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || "",
        code: image.code || "",
        extractedText: image.extractedText || ""
      };
      
      // إرسال البيانات للخدمة
      const result = await autoFillWebsiteForm(url, formData);
      
      if (result.success) {
        toast({
          title: "نجاح الإدخال التلقائي",
          description: result.message,
          variant: "default"
        });
      } else {
        toast({
          title: "فشل الإدخال التلقائي",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("خطأ في الإدخال التلقائي:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة الإدخال التلقائي",
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <Card className="overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow border-border/60 dark:border-gray-700/60 rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* صورة العنصر (55% العرض) */}
            <div className="md:col-span-7 border-b md:border-b-0 md:border-l border-border/30 dark:border-gray-700/30">
              <DraggableImage 
                image={image} 
                onImageClick={onImageClick} 
                formatDate={formatDate} 
              />
            </div>
            
            {/* بيانات العنصر (45% العرض) */}
            <div className="md:col-span-5">
              <ImageDataForm 
                image={image} 
                onTextChange={onTextChange} 
              />
            </div>
          </div>
          
          <div className="px-4 pb-4 border-t border-border/30 dark:border-gray-700/30 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActionButtons 
                imageId={image.id}
                isSubmitting={isSubmitting}
                isCompleted={image.status === "completed"}
                isSubmitted={!!image.submitted}
                isPhoneNumberValid={isPhoneNumberValid}
                onDelete={onDelete}
                onSubmit={onSubmit}
                onExport={handleExport}
              />
              
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
                onClick={handleAutoFill}
                disabled={isAutoFilling || !image.extractedText}
              >
                <Send className="h-3.5 w-3.5" />
                {isAutoFilling ? "جاري الإدخال..." : "إدخال تلقائي"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <BookmarkletGenerator 
        isOpen={isBookmarkletOpen} 
        onClose={() => setIsBookmarkletOpen(false)} 
        imageData={isBookmarkletOpen ? image : null}
      />
    </motion.div>
  );
};

export default CardItem;
