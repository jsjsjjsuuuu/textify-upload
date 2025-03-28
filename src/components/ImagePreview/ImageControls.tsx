
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  Trash2, Download, ArrowUpToLine, RefreshCw, FileText, Calculator, Copy, ChevronDown 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageData } from "@/types/ImageData";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useGeminiPromptModal } from "@/hooks/useGeminiPromptModal";

interface ImageControlsProps {
  selectedImage: ImageData;
  onCopyToClipboard: () => void;
  onExportToExcel: () => void;
  onExportToBookmarklet: () => void;
}

const ImageControls = ({
  selectedImage,
  onCopyToClipboard,
  onExportToExcel,
  onExportToBookmarklet
}: ImageControlsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  
  const { 
    handleDelete, 
    handleSubmitToApi,
    reprocessImage
  } = useImageProcessing();
  
  const { 
    openCustomPromptModal,
    openPredefinedPromptModal
  } = useGeminiPromptModal(selectedImage);

  const handleDeleteImage = async () => {
    if (window.confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
      setIsDeleting(true);
      try {
        await handleDelete(selectedImage.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSubmitImage = async () => {
    setIsSubmitting(true);
    try {
      await handleSubmitToApi(selectedImage.id);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReprocessImage = async () => {
    if (window.confirm("هل تريد إعادة معالجة هذه الصورة؟ سيتم إعادة استخراج البيانات.")) {
      setIsReprocessing(true);
      try {
        await reprocessImage(selectedImage.id);
      } finally {
        setIsReprocessing(false);
      }
    }
  };

  const isImageSubmitted = selectedImage.submitted;
  const isImageProcessing = selectedImage.status === "processing";
  const isImageError = selectedImage.status === "error";
  
  return (
    <div className="flex flex-wrap items-center justify-start gap-2 mt-4">
      {/* زر الحذف */}
      <Button 
        variant="outline" 
        size="sm" 
        className="text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
        onClick={handleDeleteImage}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? "جاري الحذف..." : "حذف"}
      </Button>
      
      {/* زر إعادة المعالجة */}
      <Button 
        variant="outline" 
        size="sm" 
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 dark:text-blue-400 px-3"
        onClick={handleReprocessImage}
        disabled={isReprocessing || isImageProcessing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isReprocessing || isImageProcessing ? 'animate-spin' : ''}`} />
        {isReprocessing ? "جاري المعالجة..." : isImageProcessing ? "قيد المعالجة..." : "إعادة معالجة"}
      </Button>
      
      {/* زر إرسال البيانات */}
      <Button 
        variant={isImageSubmitted ? "outline" : "default"} 
        size="sm"
        className={`px-3 ${isImageSubmitted ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 dark:text-green-400' : ''}`}
        onClick={handleSubmitImage}
        disabled={isSubmitting || isImageSubmitted}
      >
        <ArrowUpToLine className="h-4 w-4 mr-2" />
        {isSubmitting ? "جاري الإرسال..." : isImageSubmitted ? "تم الإرسال" : "إرسال البيانات"}
      </Button>
      
      {/* قائمة منسدلة للتصدير */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-3">
            <Download className="h-4 w-4 mr-2" />
            تصدير
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>خيارات التصدير</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCopyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            نسخ إلى الحافظة
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportToExcel}>
            <FileText className="h-4 w-4 mr-2" />
            تصدير إلى Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportToBookmarklet}>
            <Calculator className="h-4 w-4 mr-2" />
            تصدير إلى Bookmarklet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ImageControls;
