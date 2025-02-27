
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Edit, Trash, Send, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { extractTextFromImage } from "@/lib/ocrService";
import { submitTextToApi } from "@/lib/apiService";
import BackgroundPattern from "@/components/BackgroundPattern";

// Define the image data interface
interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  extractedText: string;
  confidence?: number;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  date: Date;
  status: "processing" | "completed" | "error";
  submitted?: boolean;
}

const Index = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى تحميل صور فقط",
          variant: "destructive",
        });
        continue;
      }
      
      const previewUrl = URL.createObjectURL(file);
      
      const newImage: ImageData = {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        extractedText: "",
        date: new Date(),
        status: "processing",
      };
      
      // Update state immediately to show processing
      setImages(prev => [newImage, ...prev]);
      
      // Extract text from the image
      try {
        // In development, we'll use a mock for faster testing
        let result;
        if (process.env.NODE_ENV === 'development') {
          // Mock result for development
          const mockTexts = [
            "فاتورة رقم: 12345",
            "الاسم: أحمد محمد",
            "التاريخ: 15/06/2023",
            "المبلغ: 500 ريال",
            "الخدمة: استشارات تقنية",
            "نص عربي للاختبار في هذه الصورة",
            "بيانات مالية للتحليل والمعالجة"
          ];
          await new Promise(resolve => setTimeout(resolve, 1500));
          result = {
            text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
            confidence: Math.random() * 100
          };

          // Parse mock data fields from text
          const code = "CODE" + Math.floor(Math.random() * 10000);
          const senderName = ["أحمد محمد", "سعيد علي", "عمر خالد", "فاطمة أحمد"][Math.floor(Math.random() * 4)];
          const phoneNumber = "05" + Math.floor(Math.random() * 100000000);
          const province = ["الرياض", "جدة", "الدمام", "مكة", "المدينة"][Math.floor(Math.random() * 5)];
          const price = Math.floor(Math.random() * 1000) + " ريال";

          // Update the image with extracted data
          setImages(prev =>
            prev.map(img =>
              img.id === newImage.id
                ? { 
                    ...img, 
                    extractedText: result.text, 
                    confidence: result.confidence,
                    code,
                    senderName,
                    phoneNumber,
                    province,
                    price,
                    status: "completed" 
                  }
                : img
            )
          );
        } else {
          // Real OCR in production
          result = await extractTextFromImage(file);
          
          // Here we would need a proper algorithm to extract structured fields from the text
          // For production, you might need more sophisticated text parsing or AI analysis
          
          setImages(prev =>
            prev.map(img =>
              img.id === newImage.id
                ? { 
                    ...img, 
                    extractedText: result.text, 
                    confidence: result.confidence,
                    status: "completed" 
                  }
                : img
            )
          );
        }
      } catch (error) {
        setImages(prev =>
          prev.map(img =>
            img.id === newImage.id
              ? { ...img, status: "error" }
              : img
          )
        );
        
        toast({
          title: "فشل في استخراج النص",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive",
        });
      }
      
      processedFiles++;
      setProcessingProgress(Math.round((processedFiles / totalFiles) * 100));
    }
    
    setIsProcessing(false);
    
    if (processedFiles > 0) {
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${processedFiles} صورة`,
        variant: "default",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTextChange = (id: string, field: string, value: string) => {
    setImages(prev =>
      prev.map(img => 
        img.id === id ? { ...img, [field]: value } : img
      )
    );
  };

  const handleDelete = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الصورة بنجاح",
    });
  };

  const handleSubmitToApi = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image || image.status !== "completed") {
      toast({
        title: "خطأ في الإرسال",
        description: "يرجى التأكد من اكتمال معالجة الصورة واستخراج النص",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitTextToApi({
        imageId: id,
        text: image.extractedText,
        source: image.file.name,
        date: image.date.toISOString(),
      });

      if (result.success) {
        setImages(prev =>
          prev.map(img =>
            img.id === id ? { ...img, submitted: true } : img
          )
        );

        toast({
          title: "تم الإرسال بنجاح",
          description: result.message,
        });
      } else {
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 py-8 mx-auto max-w-6xl">
        <header className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold text-brand-brown mb-3">استخراج النص من الصور</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            منصة متطورة لاستخراج النصوص من الصور تلقائيًا وإدخال البيانات بكفاءة عالية
          </p>
        </header>

        {/* Navigation Menu */}
        <nav className="mb-8 flex justify-end">
          <ul className="flex gap-6">
            <li>
              <a href="/" className="text-brand-brown font-medium hover:text-brand-coral transition-colors">
                الرئيسية
              </a>
            </li>
            <li>
              <a href="/api" className="text-brand-brown font-medium hover:text-brand-coral transition-colors">
                API
              </a>
            </li>
            <li>
              <a href="/records" className="text-brand-brown font-medium hover:text-brand-coral transition-colors">
                السجلات
              </a>
            </li>
          </ul>
        </nav>

        <div className="grid grid-cols-1 gap-8">
          {/* Upload section - reduced height */}
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div
              className={`upload-zone h-40 ${isDragging ? 'active' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e.target.files)}
                disabled={isProcessing}
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center h-full">
                <Upload size={32} className="text-brand-coral mb-2" />
                <h3 className="text-lg font-semibold mb-2">رفع الصور</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  اسحب واسقط الصور هنا أو انقر للاختيار
                </p>
                <Button 
                  className="bg-brand-brown hover:bg-brand-brown/90"
                  disabled={isProcessing}
                >
                  رفع الصور
                </Button>
              </label>
            </div>
            
            {isProcessing && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">جاري معالجة الصور...</p>
                <Progress value={processingProgress} className="h-2" />
              </div>
            )}
          </section>

          {/* Image previews and extracted text - structured with 5 fields */}
          {images.length > 0 && (
            <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-2xl font-bold text-brand-brown mb-4">معاينة الصور والنصوص المستخرجة</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.map(img => (
                  <Card key={img.id} className="p-4 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex flex-col gap-4">
                      <div className="flex">
                        {/* Image preview */}
                        <div className="relative w-1/3 h-32 rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={img.previewUrl} 
                            alt="صورة محملة" 
                            className="w-full h-full object-cover"
                          />
                          {img.status === "processing" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                              <span className="text-xs">جاري المعالجة...</span>
                            </div>
                          )}
                          {img.status === "completed" && (
                            <div className="absolute top-1 left-1 bg-green-500 text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                          {img.status === "error" && (
                            <div className="absolute top-1 left-1 bg-destructive text-white p-1 rounded-full">
                              <X size={12} />
                            </div>
                          )}
                          {img.submitted && (
                            <div className="absolute top-1 right-1 bg-brand-green text-white px-1.5 py-0.5 rounded-md text-[10px]">
                              تم الإرسال
                            </div>
                          )}
                        </div>
                        
                        {/* Extraction data */}
                        <div className="w-2/3 pr-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(img.date)}
                            </p>
                            {img.confidence !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                الدقة: {Math.round(img.confidence)}%
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">الكود:</label>
                              <input
                                type="text"
                                value={img.code || ""}
                                onChange={(e) => handleTextChange(img.id, "code", e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea"
                                dir="rtl"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">اسم المرسل:</label>
                              <input
                                type="text"
                                value={img.senderName || ""}
                                onChange={(e) => handleTextChange(img.id, "senderName", e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea"
                                dir="rtl"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">رقم الهاتف:</label>
                              <input
                                type="text"
                                value={img.phoneNumber || ""}
                                onChange={(e) => handleTextChange(img.id, "phoneNumber", e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea"
                                dir="rtl"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">المحافظة:</label>
                              <input
                                type="text"
                                value={img.province || ""}
                                onChange={(e) => handleTextChange(img.id, "province", e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea"
                                dir="rtl"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium mb-1">السعر:</label>
                              <input
                                type="text"
                                value={img.price || ""}
                                onChange={(e) => handleTextChange(img.id, "price", e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea"
                                dir="rtl"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Full extracted text */}
                      <div>
                        <label htmlFor={`text-${img.id}`} className="block text-xs font-medium mb-1">
                          النص المستخرج:
                        </label>
                        <Textarea
                          id={`text-${img.id}`}
                          value={img.extractedText}
                          onChange={(e) => handleTextChange(img.id, "extractedText", e.target.value)}
                          className="rtl-textarea min-h-16 text-xs text-right"
                          placeholder="النص المستخرج من الصورة..."
                          dir="rtl"
                        />
                      </div>
                      
                      {/* Action buttons - icon only */}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(img.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash size={16} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent/50"
                        >
                          <Edit size={16} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-brand-green hover:bg-brand-green/10"
                          disabled={img.status !== "completed" || isSubmitting || img.submitted}
                          onClick={() => handleSubmitToApi(img.id)}
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Results table */}
          {images.length > 0 && (
            <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <h2 className="text-2xl font-bold text-brand-brown mb-4">سجل النصوص المستخرجة</h2>
              
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full rtl-table">
                  <thead className="bg-muted/50">
                    <tr>
                      <th>التاريخ</th>
                      <th>الكود</th>
                      <th>اسم المرسل</th>
                      <th>رقم الهاتف</th>
                      <th>المحافظة</th>
                      <th>السعر</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map(img => (
                      <tr key={img.id} className="hover:bg-muted/20">
                        <td>{formatDate(img.date)}</td>
                        <td>{img.code || "—"}</td>
                        <td>{img.senderName || "—"}</td>
                        <td>{img.phoneNumber || "—"}</td>
                        <td>{img.province || "—"}</td>
                        <td>{img.price || "—"}</td>
                        <td>
                          {img.status === "processing" && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قيد المعالجة</span>}
                          {img.status === "completed" && !img.submitted && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">تم المعالجة</span>}
                          {img.status === "error" && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">فشل</span>}
                          {img.submitted && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">تم الإرسال</span>}
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
                              onClick={() => handleDelete(img.id)}
                            >
                              <Trash size={14} />
                            </Button>
                            {img.status === "completed" && !img.submitted && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-brand-green hover:bg-brand-green/10"
                                disabled={isSubmitting}
                                onClick={() => handleSubmitToApi(img.id)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
