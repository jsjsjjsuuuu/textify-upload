
import React from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, X, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ImageCardProps {
  image: ImageData;
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
}) => {
  const handleDelete = async () => {
    await onDelete(image.id);
  };

  const handleSubmit = () => {
    onSubmit(image.id);
  };

  const getStatusColor = () => {
    switch (image.status) {
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "processing":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "error":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  // تحقق مما إذا كانت جميع الحقول الإلزامية مملوءة
  const isValid =
    image.code &&
    image.senderName &&
    image.phoneNumber &&
    image.province &&
    image.price &&
    image.phoneNumber.replace(/\D/g, "").length === 11;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="relative">
            {image.previewUrl ? (
              <img
                src={image.previewUrl}
                alt={`صورة ${image.id}`}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">لا توجد صورة</span>
              </div>
            )}

            <div className="absolute top-2 right-2 flex gap-2">
              <Badge variant="outline" className={`${getStatusColor()}`}>
                {image.status === "completed"
                  ? "مكتمل"
                  : image.status === "processing"
                  ? "جاري المعالجة"
                  : image.status === "error"
                  ? "خطأ"
                  : "جديد"}
              </Badge>
            </div>

            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs bg-black/50 text-white rounded px-2 py-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatDate(image.date)}</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">الكود:</label>
                <input
                  type="text"
                  value={image.code || ""}
                  onChange={(e) => onTextChange(image.id, "code", e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">اسم المرسل:</label>
                <input
                  type="text"
                  value={image.senderName || ""}
                  onChange={(e) => onTextChange(image.id, "senderName", e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">رقم الهاتف:</label>
                <input
                  type="text"
                  value={image.phoneNumber || ""}
                  onChange={(e) => onTextChange(image.id, "phoneNumber", e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">المحافظة:</label>
                <input
                  type="text"
                  value={image.province || ""}
                  onChange={(e) => onTextChange(image.id, "province", e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">السعر:</label>
                <input
                  type="text"
                  value={image.price || ""}
                  onChange={(e) => onTextChange(image.id, "price", e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">اسم الشركة:</label>
                <input
                  type="text"
                  value={image.companyName || ""}
                  onChange={(e) => onTextChange(image.id, "companyName", e.target.value)}
                  className="w-full p-2 text-sm border rounded"
                />
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <X className="h-4 w-4 mr-1" />
                حذف
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting || image.status === "processing"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : image.submitted ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    تم الإرسال
                  </>
                ) : (
                  "إرسال"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ImageCard;
