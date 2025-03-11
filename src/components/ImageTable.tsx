
import { Button } from "@/components/ui/button";
import { Edit, Trash, Send, AlertCircle, FileText, Search } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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
      className="w-full"
    >
      <div className="mb-6 border-r-4 border-brand-green/60 pr-3">
        <h2 className="text-2xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
          جدول النصوص المستخرجة
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          عرض منظم لجميع البيانات المستخرجة من الصور
        </p>
      </div>
      
      <div className="rounded-xl border-2 border-border shadow-lg dark:shadow-md dark:shadow-black/20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full rtl-table">
            <thead className="bg-muted/60 dark:bg-gray-700/90 sticky top-0 z-10">
              <tr className="border-b-2 border-border dark:border-gray-600">
                <th className="font-bold text-sm py-4 px-4 text-center">الرقم</th>
                <th className="font-bold text-sm py-4 px-4">التاريخ</th>
                <th className="font-bold text-sm py-4 px-4">صورة معاينة</th>
                <th className="font-bold text-sm py-4 px-4">الكود</th>
                <th className="font-bold text-sm py-4 px-4">اسم المرسل</th>
                <th className="font-bold text-sm py-4 px-4">رقم الهاتف</th>
                <th className="font-bold text-sm py-4 px-4">المحافظة</th>
                <th className="font-bold text-sm py-4 px-4">السعر</th>
                <th className="font-bold text-sm py-4 px-4">دقة الاستخراج</th>
                <th className="font-bold text-sm py-4 px-4">الحالة</th>
                <th className="font-bold text-sm py-4 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {images.map(image => {
                // التحقق من صحة رقم الهاتف
                const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
                
                return (
                  <tr 
                    key={image.id} 
                    className="hover:bg-muted/30 dark:hover:bg-gray-700/40 transition-colors border-b border-border/50 dark:border-gray-700/50 last:border-none"
                  >
                    <td className="py-3.5 px-4 text-sm text-center font-semibold">{image.number}</td>
                    <td className="py-3.5 px-4 text-sm">{formatDate(image.date)}</td>
                    <td className="py-3.5 px-4">
                      <div 
                        className="w-20 h-20 rounded-lg overflow-hidden bg-transparent cursor-pointer border-2 border-border/40 dark:border-gray-700/40 transition-transform hover:scale-105 group shadow-sm hover:shadow-md" 
                        onClick={() => onImageClick(image)}
                      >
                        <img 
                          src={image.previewUrl} 
                          alt="صورة مصغرة" 
                          className="object-contain h-full w-full transition-transform duration-200 group-hover:scale-110" 
                          style={{ mixBlendMode: 'multiply' }} 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Search className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm font-medium">{image.code || "—"}</td>
                    <td className="py-3.5 px-4 text-sm">{image.senderName || "—"}</td>
                    <td className="py-3.5 px-4 text-sm relative">
                      <div className="flex items-center">
                        <span className={image.phoneNumber && !isPhoneNumberValid ? "text-destructive font-medium" : "font-medium"}>
                          {image.phoneNumber || "—"}
                        </span>
                        {image.phoneNumber && !isPhoneNumberValid && (
                          <span className="mr-1.5 text-destructive">
                            <AlertCircle size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm">{image.province || "—"}</td>
                    <td className="py-3.5 px-4 text-sm font-medium">{image.price ? `${image.price} د.ع` : "—"}</td>
                    <td className="py-3.5 px-4 text-sm">
                      {image.confidence ? (
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 max-w-16">
                            <div 
                              className={`h-2 rounded-full ${image.confidence > 85 ? 'bg-brand-green' : image.confidence > 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.round(image.confidence)}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{Math.round(image.confidence)}%</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-sm">
                      {image.status === "processing" && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-yellow-100/80 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800/50 dark:text-yellow-400">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse mr-1.5"></span>
                          قيد المعالجة
                        </Badge>
                      )}
                      {image.status === "completed" && !image.submitted && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-blue-100/80 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                          تم المعالجة
                        </Badge>
                      )}
                      {image.status === "error" && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-red-100/80 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                          فشل
                        </Badge>
                      )}
                      {image.submitted && (
                        <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-5 font-medium bg-green-100/80 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                          تم الإرسال
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-muted/70 text-muted-foreground hover:bg-accent/70 hover:text-foreground transition-colors"
                          title="عرض التفاصيل"
                          onClick={() => onImageClick(image)}
                        >
                          <FileText size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-muted/70 text-destructive hover:bg-destructive/20 transition-colors" 
                          onClick={() => onDelete(image.id)}
                          title="حذف"
                        >
                          <Trash size={16} />
                        </Button>
                        {image.status === "completed" && !image.submitted && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full bg-muted/70 text-brand-green hover:bg-brand-green/20 transition-colors" 
                            disabled={isSubmitting || (image.phoneNumber && !isPhoneNumberValid)} 
                            onClick={() => onSubmit(image.id)}
                            title="إرسال"
                          >
                            <Send size={16} />
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
