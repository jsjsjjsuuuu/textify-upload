
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Send, Trash2, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ImageActionsProps {
  imageId: string;
  status: string;
  isSubmitting: boolean;
  submitted?: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onReprocess?: (id: string) => void;
  canReprocess?: boolean; // إضافة خاصية للتحكم في إمكانية إعادة المعالجة
}

const ImageActions: React.FC<ImageActionsProps> = ({
  imageId,
  status,
  isSubmitting,
  submitted = false,
  onDelete,
  onSubmit,
  onReprocess,
  canReprocess = true // القيمة الافتراضية true تسمح بإعادة المعالجة
}) => {
  
  const handleDelete = () => {
    if (window.confirm("هل أنت متأكد من رغبتك بحذف هذه الصورة؟")) {
      onDelete(imageId);
    }
  };
  
  const handleSubmit = () => {
    onSubmit(imageId);
  };
  
  const handleReprocess = () => {
    if (onReprocess) {
      onReprocess(imageId);
    }
  };
  
  // تحديد ما إذا كان يجب عرض زر إعادة المعالجة
  // فقط عرضه إذا كان canReprocess = true وكانت الحالة ليست "processing"
  const showReprocessButton = canReprocess && onReprocess && status !== "processing";
  
  return (
    <div className="flex gap-2 justify-end mt-2">
      {status === "processing" ? (
        <Button variant="outline" size="sm" disabled className="text-blue-500">
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          جاري المعالجة
        </Button>
      ) : (
        <>
          {!submitted && status === "completed" && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSubmit}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  إرسال البيانات
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>إرسال البيانات المستخرجة إلى API</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {showReprocessButton && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleReprocess}
                  variant="outline"
                  size="sm"
                  className="text-blue-500"
                  disabled={status === "processing"}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  إعادة المعالجة
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>إعادة معالجة الصورة واستخراج البيانات</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {submitted && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-500"
                  disabled
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  تم الإرسال
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تم إرسال البيانات بنجاح</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                حذف
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>حذف الصورة</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
};

export default ImageActions;
