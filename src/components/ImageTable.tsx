
import { Button } from "@/components/ui/button";
import { Edit, Trash, Send } from "lucide-react";
import { ImageData } from "@/types/ImageData";

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
    <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <h2 className="text-2xl font-bold text-brand-brown mb-4">سجل النصوص المستخرجة</h2>
      
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full rtl-table">
          <thead className="bg-muted/50">
            <tr>
              <th>الرقم</th>
              <th>التاريخ</th>
              <th>صورة معاينة</th>
              <th>الكود</th>
              <th>اسم المرسل</th>
              <th>رقم الهاتف</th>
              <th>المحافظة</th>
              <th>السعر</th>
              <th>دقة الاستخراج</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {images.map(image => (
              <tr key={image.id} className="hover:bg-muted/20">
                <td>{image.number}</td>
                <td>{formatDate(image.date)}</td>
                <td className="w-24">
                  <div 
                    className="w-20 h-20 rounded-lg overflow-hidden bg-transparent cursor-pointer" 
                    onClick={() => onImageClick(image)}
                  >
                    <img 
                      src={image.previewUrl} 
                      alt="صورة مصغرة" 
                      className="object-contain transition-transform duration-200" 
                      style={{ mixBlendMode: 'multiply' }} 
                    />
                  </div>
                </td>
                <td>{image.code || "—"}</td>
                <td>{image.senderName || "—"}</td>
                <td>{image.phoneNumber || "—"}</td>
                <td>{image.province || "—"}</td>
                <td>{image.price || "—"}</td>
                <td>{image.confidence ? Math.round(image.confidence) + "%" : "—"}</td>
                <td>
                  {image.status === "processing" && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قيد المعالجة</span>
                  )}
                  {image.status === "completed" && !image.submitted && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">تم المعالجة</span>
                  )}
                  {image.status === "error" && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">فشل</span>
                  )}
                  {image.submitted && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">تم الإرسال</span>
                  )}
                </td>
                <td>
                  <div className="flex gap-2 justify-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-accent/50">
                      <Edit size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                      onClick={() => onDelete(image.id)}
                    >
                      <Trash size={14} />
                    </Button>
                    {image.status === "completed" && !image.submitted && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-brand-green hover:bg-brand-green/10" 
                        disabled={isSubmitting} 
                        onClick={() => onSubmit(image.id)}
                      >
                        <Send size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ImageTable;
