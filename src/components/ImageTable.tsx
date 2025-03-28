
import { Button } from "@/components/ui/button";
import { Edit, Trash, Send, AlertCircle } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface ImageTableProps {
  images: ImageData[];
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageTable = ({
  images,
  isSubmitting,
  onImageClick,
  onDelete,
  onSubmit,
  formatDate
}: ImageTableProps) => {
  const [groupedImages, setGroupedImages] = useState<{ [key: string]: ImageData[] }>({});
  
  // تجميع الصور حسب batch_id
  useEffect(() => {
    const grouped: { [key: string]: ImageData[] } = {};
    
    images.forEach(image => {
      const batchId = image.batch_id || 'default';
      if (!grouped[batchId]) {
        grouped[batchId] = [];
      }
      grouped[batchId].push(image);
    });
    
    setGroupedImages(grouped);
  }, [images]);
  
  if (images.length === 0) return null;
  
  // تحويل المجموعات المرتبة إلى مصفوفة مسطحة مع معلومات إضافية
  const prepareImageRows = () => {
    const rows: (ImageData & { isFirstInBatch?: boolean; isLastInBatch?: boolean; showBatchConnector?: boolean })[] = [];
    
    // ترتيب المجموعات حسب التاريخ (الأحدث أولاً)
    const sortedBatchIds = Object.keys(groupedImages).sort((a, b) => {
      const dateA = groupedImages[a][0].date.getTime();
      const dateB = groupedImages[b][0].date.getTime();
      return dateB - dateA;
    });
    
    sortedBatchIds.forEach(batchId => {
      const batchImages = [...groupedImages[batchId]].sort((a, b) => {
        // ترتيب الصور داخل المجموعة حسب الرقم
        return (a.number || 0) - (b.number || 0);
      });
      
      const hasManyImages = batchImages.length > 1;
      
      batchImages.forEach((image, index) => {
        rows.push({
          ...image,
          isFirstInBatch: index === 0,
          isLastInBatch: index === batchImages.length - 1,
          showBatchConnector: hasManyImages && index < batchImages.length - 1
        });
      });
    });
    
    return rows;
  };
  
  const preparedImages = prepareImageRows();

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10"
    >
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="bg-brand-green/10 w-1.5 h-6 rounded mr-2 block"></span>
        سجل النصوص المستخرجة
      </h2>
      
      <div className="overflow-hidden rounded-xl border border-border shadow-sm dark:shadow-md dark:shadow-black/5 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full rtl-table">
            <thead className="bg-muted/30 dark:bg-gray-700/50">
              <tr className="border-b border-border dark:border-gray-700">
                <th className="font-semibold text-sm py-3.5 px-4">الرقم</th>
                <th className="font-semibold text-sm py-3.5 px-4">التاريخ</th>
                <th className="font-semibold text-sm py-3.5 px-4">صورة معاينة</th>
                <th className="font-semibold text-sm py-3.5 px-4">الكود</th>
                <th className="font-semibold text-sm py-3.5 px-4">اسم المرسل</th>
                <th className="font-semibold text-sm py-3.5 px-4">رقم الهاتف</th>
                <th className="font-semibold text-sm py-3.5 px-4">المحافظة</th>
                <th className="font-semibold text-sm py-3.5 px-4">السعر</th>
                <th className="font-semibold text-sm py-3.5 px-4">دقة الاستخراج</th>
                <th className="font-semibold text-sm py-3.5 px-4">الحالة</th>
                <th className="font-semibold text-sm py-3.5 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {preparedImages.map((image, rowIndex) => {
                // التحقق من صحة رقم الهاتف
                const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
                
                return (
                  <tr 
                    key={image.id} 
                    className="hover:bg-muted/10 dark:hover:bg-gray-700/20 transition-colors border-b border-border/40 dark:border-gray-700/40 last:border-none relative"
                  >
                    <td className="py-3 px-4 text-sm relative">
                      {/* عرض مؤشر الدفعة إذا كانت الصورة جزءًا من مجموعة */}
                      {image.showBatchConnector && (
                        <div className="absolute top-1/2 right-0 h-full">
                          <div className="absolute top-1/2 bottom-0 right-2 border-r-2 border-dashed border-yellow-500"></div>
                        </div>
                      )}
                      {image.isFirstInBatch && image.showBatchConnector && (
                        <div className="absolute -bottom-0 right-2">
                          <div className="w-4 h-4 flex items-center justify-center border-2 border-yellow-500 bg-white dark:bg-gray-800 rounded-full">
                            <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                          </div>
                        </div>
                      )}
                      
                      {image.number || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="text-muted-foreground">{formatDate(image.date)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div 
                        className="w-20 h-20 rounded-lg overflow-hidden bg-transparent cursor-pointer border border-border/40 dark:border-gray-700/40 transition-transform hover:scale-105 group" 
                        onClick={() => onImageClick(image)}
                      >
                        <img 
                          src={image.previewUrl} 
                          alt="صورة مصغرة" 
                          className="object-contain h-full w-full transition-transform duration-200 group-hover:scale-110" 
                          style={{ mixBlendMode: 'multiply' }} 
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{image.code || "—"}</td>
                    <td className="py-3 px-4 text-sm">{image.senderName || "—"}</td>
                    <td className="py-3 px-4 text-sm relative">
                      <div className="flex items-center">
                        <span className={image.phoneNumber && !isPhoneNumberValid ? "text-destructive" : ""}>
                          {image.phoneNumber || "—"}
                        </span>
                        {image.phoneNumber && !isPhoneNumberValid && (
                          <span className="mr-1.5 text-destructive">
                            <AlertCircle size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{image.province || "—"}</td>
                    <td className="py-3 px-4 text-sm">{image.price || "—"}</td>
                    <td className="py-3 px-4 text-sm">
                      {image.confidence ? (
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mr-2 max-w-16">
                            <div 
                              className="bg-brand-green h-1.5 rounded-full" 
                              style={{ width: `${Math.round(image.confidence)}%` }}
                            ></div>
                          </div>
                          <span>{Math.round(image.confidence)}%</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {image.status === "processing" && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-yellow-100/50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300">
                          <span className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse mr-1.5"></span>
                          قيد المعالجة
                        </Badge>
                      )}
                      {image.status === "completed" && !image.submitted && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-blue-100/50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/40 dark:text-blue-300">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mr-1.5"></span>
                          تم المعالجة
                        </Badge>
                      )}
                      {image.status === "error" && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-red-100/50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-300">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                          فشل
                        </Badge>
                      )}
                      {image.submitted && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-green-100/50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/40 dark:text-green-300">
                          <span className="w-1 h-1 bg-green-500 rounded-full mr-1.5"></span>
                          تم الإرسال
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5 justify-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-full bg-muted/30 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-full bg-muted/30 text-destructive hover:bg-destructive/10" 
                          onClick={() => onDelete(image.id)}
                        >
                          <Trash size={14} />
                        </Button>
                        {image.status === "completed" && !image.submitted && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full bg-muted/30 text-brand-green hover:bg-brand-green/10" 
                            disabled={isSubmitting || (image.phoneNumber && !isPhoneNumberValid)} 
                            onClick={() => onSubmit(image.id)}
                          >
                            <Send size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
};

export default ImageTable;
