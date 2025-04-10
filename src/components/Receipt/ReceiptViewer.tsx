
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, SendHorizonal, ZoomIn, ZoomOut, RefreshCw, Maximize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageData } from "@/types/ImageData";
import ReceiptImage from "./ReceiptImage";
import ReceiptDataForm from "./ReceiptDataForm";
import { useToast } from "@/hooks/use-toast";

interface ReceiptViewerProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  isSubmitting?: boolean;
}

const ReceiptViewer: React.FC<ReceiptViewerProps> = ({
  image,
  onTextChange,
  onDelete,
  onSubmit,
  isSubmitting = false
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState<"data" | "text">("data");
  const { toast } = useToast();

  // التحقق من اكتمال بيانات الصورة
  const isImageComplete = (): boolean => {
    return !!(
      image.code && 
      image.senderName && 
      image.phoneNumber && 
      image.province && 
      image.price &&
      image.phoneNumber.replace(/[^\d]/g, '').length === 11
    );
  };

  // التحقق من وجود خطأ في رقم الهاتف
  const hasPhoneError = (): boolean => {
    return !!image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleDelete = () => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذه الصورة؟");
    if (confirmed) {
      onDelete(image.id);
      toast({
        title: "تم الحذف",
        description: "تم حذف الصورة بنجاح"
      });
    }
  };

  const handleSubmit = () => {
    if (!isImageComplete()) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى إكمال جميع البيانات المطلوبة قبل الإرسال",
        variant: "destructive"
      });
      return;
    }

    if (hasPhoneError()) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: "يجب أن يكون رقم الهاتف 11 رقم بالضبط",
        variant: "destructive"
      });
      return;
    }

    onSubmit(image.id);
  };

  return (
    <div className="bg-slate-950 rounded-lg overflow-hidden shadow-xl border border-purple-900/30">
      <div className="flex justify-between items-center bg-gray-900 px-4 py-3 border-b border-gray-800">
        <h3 className="text-lg font-medium text-white">
          {isZoomed ? "تكبير الصورة" : "عرض الصورة والبيانات"}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isZoomed ? "secondary" : "outline"}
            onClick={toggleZoom}
            className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
          >
            {isZoomed ? <ZoomOut className="h-4 w-4 ml-1" /> : <ZoomIn className="h-4 w-4 ml-1" />}
            {isZoomed ? "تصغير" : "تكبير"}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-400 hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4 ml-1" />
            حذف
          </Button>
          
          {!isZoomed && isImageComplete() && !hasPhoneError() && (
            <Button
              size="sm"
              variant="default"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <SendHorizonal className="h-4 w-4 ml-1" />
              إرسال
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isZoomed ? (
          <motion.div
            key="zoomed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <ReceiptImage 
              image={image} 
              isZoomed={true} 
              onDoubleClick={toggleZoom}
            />
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-0"
          >
            <div className="p-1 bg-gray-900 border-l border-gray-800">
              <ReceiptImage 
                image={image} 
                isZoomed={false} 
                onClick={toggleZoom}
              />
            </div>
            <div className="p-4 bg-gray-900">
              <Tabs defaultValue="data" value={activeTab} onValueChange={(value) => setActiveTab(value as "data" | "text")}>
                <TabsList className="mb-4 bg-gray-800">
                  <TabsTrigger value="data" className="data-tab">
                    البيانات المستخرجة
                  </TabsTrigger>
                  <TabsTrigger value="text" className="text-tab">
                    النص الكامل
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="mt-0">
                  <ReceiptDataForm
                    image={image}
                    onTextChange={onTextChange}
                  />
                </TabsContent>
                
                <TabsContent value="text" className="mt-0">
                  <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 h-96 overflow-y-auto font-mono whitespace-pre-wrap">
                    {image.extractedText || "لا يوجد نص مستخرج"}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceiptViewer;
