
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Edit, Trash, Diamond, Check, X, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  date: Date;
  status: "processing" | "completed" | "error";
  submitted?: boolean;
}

const Index = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    
    const newImages: ImageData[] = [];
    
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
      
      newImages.push(newImage);
      
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
        } else {
          // Real OCR in production
          result = await extractTextFromImage(file);
        }
        
        // Update the image with extracted text
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

  const handleTextChange = (id: string, text: string) => {
    setImages(prev =>
      prev.map(img => 
        img.id === id ? { ...img, extractedText: text } : img
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
    if (!image || image.status !== "completed" || !image.extractedText.trim()) {
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
        <header className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-bold text-brand-brown mb-3">استخراج النص من الصور</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            منصة متطورة لاستخراج النصوص من الصور تلقائيًا وإدخال البيانات بكفاءة عالية
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10">
          {/* API Settings Section */}
          <section className="animate-slide-up border rounded-lg p-4 bg-white/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-brand-brown mb-4">إعدادات API</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                  مفتاح API:
                </label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="أدخل مفتاح API الخاص بك"
                  className="rtl-textarea text-right"
                  dir="rtl"
                />
              </div>
              <div className="self-end">
                <Button variant="outline" className="w-full md:w-auto">
                  <Check size={16} className="ml-2" />
                  تحقق من الاتصال
                </Button>
              </div>
            </div>
          </section>

          {/* Upload section */}
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div
              className={`upload-zone ${isDragging ? 'active' : ''}`}
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
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                <Upload size={40} className="text-brand-coral mb-3" />
                <h3 className="text-xl font-semibold mb-2">رفع الصور</h3>
                <p className="text-muted-foreground">
                  اسحب واسقط الصور هنا أو انقر للاختيار
                </p>
                <Button 
                  className="mt-4 bg-brand-green hover:bg-brand-green/90"
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

          {/* Image previews and extracted text */}
          {images.length > 0 && (
            <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-2xl font-bold text-brand-brown mb-4">معاينة الصور والنصوص المستخرجة</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.map(img => (
                  <Card key={img.id} className="p-4 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex flex-col gap-4">
                      <div className="relative rounded-lg overflow-hidden h-48 bg-muted">
                        <img 
                          src={img.previewUrl} 
                          alt="صورة محملة" 
                          className="w-full h-full object-contain"
                        />
                        {img.status === "processing" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                            جاري المعالجة...
                          </div>
                        )}
                        {img.status === "completed" && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded-full">
                            <Check size={16} />
                          </div>
                        )}
                        {img.status === "error" && (
                          <div className="absolute top-2 left-2 bg-destructive text-white p-1 rounded-full">
                            <X size={16} />
                          </div>
                        )}
                        {img.submitted && (
                          <div className="absolute top-2 right-2 bg-brand-green text-white px-2 py-1 rounded-md text-xs">
                            تم الإرسال
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(img.date)}
                          </p>
                          {img.confidence !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              الدقة: {Math.round(img.confidence)}%
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <label htmlFor={`text-${img.id}`} className="block text-sm font-medium mb-1">
                            النص المستخرج:
                          </label>
                          <Textarea
                            id={`text-${img.id}`}
                            value={img.extractedText}
                            onChange={(e) => handleTextChange(img.id, e.target.value)}
                            className="rtl-textarea min-h-24 text-right"
                            placeholder="النص المستخرج من الصورة..."
                            dir="rtl"
                          />
                        </div>
                        
                        <div className="flex justify-between mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(img.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash size={16} className="ml-2" />
                            حذف
                          </Button>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Edit size={16} className="ml-2" />
                              تعديل
                            </Button>
                            
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-brand-green hover:bg-brand-green/90"
                              disabled={img.status !== "completed" || isSubmitting || !apiKey || img.submitted}
                              onClick={() => handleSubmitToApi(img.id)}
                            >
                              <Send size={16} className="ml-2" />
                              إرسال
                            </Button>
                          </div>
                        </div>
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
                      <th>الصورة</th>
                      <th>النص المستخرج</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map(img => (
                      <tr key={img.id} className="hover:bg-muted/20">
                        <td>{formatDate(img.date)}</td>
                        <td className="w-24">
                          <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                            <img 
                              src={img.previewUrl} 
                              alt="صورة مصغرة" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="max-w-xs">
                          <p className="truncate">{img.extractedText || "—"}</p>
                        </td>
                        <td>
                          {img.status === "processing" && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قيد المعالجة</span>}
                          {img.status === "completed" && !img.submitted && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">تم المعالجة</span>}
                          {img.status === "error" && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">فشل</span>}
                          {img.submitted && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">تم الإرسال</span>}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit size={16} className="text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive" 
                              onClick={() => handleDelete(img.id)}
                            >
                              <Trash size={16} />
                            </Button>
                            {img.status === "completed" && !img.submitted && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-brand-green"
                                disabled={!apiKey || isSubmitting}
                                onClick={() => handleSubmitToApi(img.id)}
                              >
                                <Send size={16} />
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
