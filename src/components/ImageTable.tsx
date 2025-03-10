
import { Button } from "@/components/ui/button";
import { Edit, Trash, Send, AlertCircle } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";

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
  if (images.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-10"
    >
      <h2 className="text-2xl font-bold text-brand-brown dark:text-brand-beige mb-6 flex items-center">
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
              {images.map(image => {
                // التحقق من صحة رقم الهاتف
                const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
                
                return (
                  <tr 
                    key={image.id} 
                    className="hover:bg-muted/10 dark:hover:bg-gray-700/20 transition-colors border-b border-border/40 dark:border-gray-700/40 last:border-none"
                  >
                    <td className="py-3 px-4 text-sm">{image.number}</td>
                    <td className="py-3 px-4 text-sm">{formatDate(image.date)}</td>
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
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-full text-xs inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                          قيد المعالجة
                        </span>
                      )}
                      {image.status === "completed" && !image.submitted && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-full text-xs inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          تم المعالجة
                        </span>
                      )}
                      {image.status === "error" && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-full text-xs inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          فشل
                        </span>
                      )}
                      {image.submitted && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-full text-xs inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          تم الإرسال
                        </span>
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
