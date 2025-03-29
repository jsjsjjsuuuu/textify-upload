
import React from "react";
import { ImageData } from "@/types/ImageData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Save, RefreshCw } from "lucide-react";

interface ImageDataPanelProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean> | void;
  onSubmit: (id: string) => void;
  isSubmitting: boolean;
  reprocessButton?: React.ReactNode;
}

const ImageDataPanel: React.FC<ImageDataPanelProps> = ({
  image,
  onTextChange,
  onDelete,
  onSubmit,
  isSubmitting,
  reprocessButton
}) => {
  // قائمة الحقول التي سيتم عرضها
  const fields = [
    { key: "code", label: "الرمز" },
    { key: "senderName", label: "اسم المرسل" },
    { key: "phoneNumber", label: "رقم الهاتف" },
    { key: "province", label: "المنطقة" },
    { key: "price", label: "المبلغ" },
    { key: "companyName", label: "اسم الشركة" },
  ];

  // تحديد ما إذا كان يمكن تقديم البيانات
  const canSubmit = image.status === "completed" && !image.submitted;

  return (
    <div className="col-span-3 bg-muted/30 rounded-r-lg">
      <div className="border-b px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium">بيانات مستخرجة</h3>
        <div className="flex items-center gap-2">
          {reprocessButton}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(image.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            حذف
          </Button>
          
          {canSubmit && (
            <Button
              size="sm"
              onClick={() => onSubmit(image.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-1" />
              )}
              حفظ
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-310px)] min-h-[400px]">
        <div className="p-4 space-y-4">
          {/* النص المستخرج */}
          {image.extractedText && (
            <div className="mb-6">
              <Label className="mb-2 block">النص المستخرج</Label>
              <div className="bg-background p-3 rounded-md text-sm border overflow-auto max-h-40 whitespace-pre-wrap">
                {image.extractedText}
              </div>
            </div>
          )}
          
          {/* حقول البيانات المستخرجة */}
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={image[field.key as keyof ImageData] as string || ""}
                  onChange={(e) => onTextChange(image.id, field.key, e.target.value)}
                  placeholder={`أدخل ${field.label.toLowerCase()}`}
                  className="bg-background"
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ImageDataPanel;
