import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Edit, Trash, Send, Check, X, ZoomIn, ZoomOut, Maximize2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { extractTextFromImage } from "@/lib/ocrService";
import { submitTextToApi, extractDataWithGemini, fileToBase64 } from "@/lib/apiService";
import BackgroundPattern from "@/components/BackgroundPattern";

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
  number?: number;
}

const Index = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [useGemini, setUseGemini] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const geminiApiKey = localStorage.getItem("geminiApiKey");
    setUseGemini(!!geminiApiKey);
    
    if (!geminiApiKey) {
      const defaultApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      localStorage.setItem("geminiApiKey", defaultApiKey);
      setUseGemini(true);
    }
  }, []);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "";

    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى تحميل صور فقط",
          variant: "destructive"
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
        number: startingNumber + i
      };
      
      setImages(prev => [newImage, ...prev]);
      
      try {
        if (process.env.NODE_ENV === 'development' && !geminiApiKey) {
          const mockTexts = ["فاتورة رقم: 12345", "الاسم: أحمد محمد", "التاريخ: 15/06/2023", "المبلغ: 500 ريال", "الخدمة: استشارات تقنية", "نص عربي للاختبار في هذه الصورة", "بيانات مالية للتحليل والمعالجة"];
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const result = {
            text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
            confidence: Math.random() * 100
          };
          
          const code = "CODE" + Math.floor(Math.random() * 10000);
          const senderName = ["أحمد محمد", "سعيد علي", "عمر خالد", "فاطمة أحمد"][Math.floor(Math.random() * 4)];
          const phoneNumber = "05" + Math.floor(Math.random() * 100000000);
          const province = ["الرياض", "جدة", "الدمام", "مكة", "المدينة"][Math.floor(Math.random() * 5)];
          const price = Math.floor(Math.random() * 1000) + " ريال";
          
          setImages(prev => prev.map(img => img.id === newImage.id ? {
            ...img,
            extractedText: result.text,
            confidence: result.confidence,
            code,
            senderName,
            phoneNumber,
            province,
            price,
            status: "completed"
          } : img));
        } else if (geminiApiKey) {
          const imageBase64 = await fileToBase64(file);
          
          const extractionResult = await extractDataWithGemini({
            apiKey: geminiApiKey,
            imageBase64
          });
          
          if (extractionResult.success && extractionResult.data) {
            const { parsedData, extractedText } = extractionResult.data;
            
            setImages(prev => prev.map(img => img.id === newImage.id ? {
              ...img,
              extractedText: extractedText || "",
              confidence: 95,
              code: parsedData?.code || "",
              senderName: parsedData?.senderName || "",
              phoneNumber: parsedData?.phoneNumber || "",
              province: parsedData?.province || "",
              price: parsedData?.price || "",
              status: "completed"
            } : img));

            toast({
              title: "تم الاستخراج بنجاح",
              description: "تم استخراج البيانات باستخدام Gemini AI",
            });
          } else {
            const result = await extractTextFromImage(file);
            
            setImages(prev => prev.map(img => img.id === newImage.id ? {
              ...img,
              extractedText: result.text,
              confidence: result.confidence,
              status: "completed"
            } : img));
            
            toast({
              title: "تنبيه",
              description: "تم استخدام OCR التقليدي بسبب: " + extractionResult.message,
              variant: "default"
            });
          }
        } else {
          const result = await extractTextFromImage(file);
          
          setImages(prev => prev.map(img => img.id === newImage.id ? {
            ...img,
            extractedText: result.text,
            confidence: result.confidence,
            status: "completed"
          } : img));
        }
      } catch (error) {
        setImages(prev => prev.map(img => img.id === newImage.id ? {
          ...img,
          status: "error"
        } : img));
        
        toast({
          title: "فشل في استخراج النص",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive"
        });
      }
      
      processedFiles++;
      setProcessingProgress(Math.round(processedFiles / totalFiles * 100));
    }
    
    setIsProcessing(false);
    
    if (processedFiles > 0) {
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${processedFiles} صورة${geminiApiKey ? " باستخدام Gemini AI" : ""}`,
        variant: "default"
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
    setImages(prev => prev.map(img => img.id === id ? {
      ...img,
      [field]: value
    } : img));

    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    }
  };

  const handleDelete = (id: string) => {
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(null);
    }
    setImages(prev => prev.filter(img => img.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الصورة بنجاح"
    });
  };

  const handleSubmitToApi = async (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image || image.status !== "completed") {
      toast({
        title: "خطأ في الإرسال",
        description: "يرجى التأكد من اكتمال معالجة الصورة واستخراج النص",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitTextToApi({
        imageId: id,
        text: image.extractedText,
        source: image.file.name,
        date: image.date.toISOString()
      });
      if (result.success) {
        const updatedImage = {
          ...image,
          submitted: true
        };
        setImages(prev => prev.map(img => img.id === id ? updatedImage : img));

        if (selectedImage && selectedImage.id === id) {
          setSelectedImage(updatedImage);
        }
        toast({
          title: "تم الإرسال بنجاح",
          description: result.message
        });
      } else {
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء ��لاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image);
    setZoomLevel(1);
  };

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      calendar: 'gregory'
    }).replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
  };

  const sortedImages = [...images].sort((a, b) => {
    const aNum = a.number || 0;
    const bNum = b.number || 0;
    return bNum - aNum;
  });

  return <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 py-8 mx-auto max-w-6xl">
        <header className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold text-brand-brown mb-3">استخراج النص من الصور</h1>
        </header>

        <nav className="mb-8 flex justify-end">
          <ul className="flex gap-6 py-[3px] my-0 mx-[240px] px-[174px]">
            <li>
              <a href="/" className="text-brand-brown font-medium hover:text-brand-coral transition-colors my-[46px]">
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
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {useGemini && (
                  <div className="flex items-center bg-brand-brown/10 text-brand-brown px-3 py-1 rounded-full text-sm ml-2">
                    <Brain size={16} className="mr-1" />
                    تمكين Gemini AI
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => window.location.href = '/records'}
                variant="outline"
                className="text-sm"
              >
                إعدادات استخراج البيانات
              </Button>
            </div>
            
            <div 
              onDrop={handleDrop} 
              onDragOver={handleDragOver} 
              onDragLeave={handleDragLeave} 
              className="bg-transparent my-0 mx-[79px] px-[17px] py-6 rounded-3xl border-2 border-dashed border-brand-brown/30 hover:border-brand-brown/50 transition-colors"
            >
              <input 
                type="file" 
                id="image-upload" 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={e => handleFileChange(e.target.files)} 
                disabled={isProcessing} 
              />
              <label 
                htmlFor="image-upload" 
                className="cursor-pointer flex flex-col items-center justify-center h-full"
              >
                <Upload size={36} className="text-brand-brown/70 mb-2" />
                <p className="text-brand-brown font-medium mb-2">اسحب وأفلت الصور هنا</p>
                <Button className="bg-brand-brown hover:bg-brand-brown/90" disabled={isProcessing}>
                  <Upload size={16} className="mr-2" />
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

          {sortedImages.length > 0 && <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-2xl font-bold text-brand-brown mb-4">معاينة الصور والنصوص المستخرجة</h2>
              
              <div className="space-y-4">
                {sortedImages.map(img => <Card key={img.id} className="p-4 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-transparent border-none backdrop-blur-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex">
                        <div className="relative w-[300px] h-[200px] rounded-lg overflow-hidden bg-transparent group cursor-pointer" onClick={() => handleImageClick(img)}>
                          <img src={img.previewUrl} alt="صورة محملة" className="w-full h-full object-contain" style={{
                      mixBlendMode: 'multiply'
                    }} />
                          <div className="absolute top-1 left-1 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
                            صورة {img.number}
                          </div>
                          {img.status === "processing" && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                              <span className="text-xs">جاري المعالجة...</span>
                            </div>}
                          {img.status === "completed" && <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full">
                              <Check size={12} />
                            </div>}
                          {img.status === "error" && <div className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full">
                              <X size={12} />
                            </div>}
                          {img.submitted && <div className="absolute bottom-1 right-1 bg-brand-green text-white px-1.5 py-0.5 rounded-md text-[10px]">
                              تم الإرسال
                            </div>}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white/90 p-1 rounded-full">
                              <ZoomIn size={20} className="text-brand-brown" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 pr-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(img.date)}
                            </p>
                            {img.confidence !== undefined && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                دقة الاستخراج: {Math.round(img.confidence)}%
                              </span>}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">الكود:</label>
                              <input type="text" value={img.code || ""} onChange={e => handleTextChange(img.id, "code", e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">اسم المرسل:</label>
                              <input type="text" value={img.senderName || ""} onChange={e => handleTextChange(img.id, "senderName", e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">رقم الهاتف:</label>
                              <input type="text" value={img.phoneNumber || ""} onChange={e => handleTextChange(img.id, "phoneNumber", e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs font-medium mb-1">المحافظة:</label>
                              <input type="text" value={img.province || ""} onChange={e => handleTextChange(img.id, "province", e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium mb-1">السعر:</label>
                              <input type="text" value={img.price || ""} onChange={e => handleTextChange(img.id, "price", e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(img.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash size={16} />
                        </Button>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-accent/50">
                          <Edit size={16} />
                        </Button>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-green hover:bg-brand-green/10" disabled={img.status !== "completed" || isSubmitting || img.submitted} onClick={() => handleSubmitToApi(img.id)}>
                          <Send size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>)}
              </div>
            </section>}

          {sortedImages.length > 0 && <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
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
                    {sortedImages.map(img => <tr key={img.id} className="hover:bg-muted/20">
                        <td>{img.number}</td>
                        <td>{formatDate(img.date)}</td>
                        <td className="w-24">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-transparent cursor-pointer" onClick={() => handleImageClick(img)}>
                            <img src={img.previewUrl} alt="صورة مصغرة" className="object-contain transition-transform duration-200" style={{
                        mixBlendMode: 'multiply'
                      }} />
                          </div>
                        </td>
                        <td>{img.code || "—"}</td>
                        <td>{img.senderName || "—"}</td>
                        <td>{img.phoneNumber || "—"}</td>
                        <td>{img.province || "—"}</td>
                        <td>{img.price || "—"}</td>
                        <td>{img.confidence ? Math.round(img.confidence) + "%" : "—"}</td>
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(img.id)}>
                              <Trash size={14} />
                            </Button>
                            {img.status === "completed" && !img.submitted && <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-green hover:bg-brand-green/10" disabled={isSubmitting} onClick={() => handleSubmitToApi(img.id)}>
                                <Send size={14} />
                              </Button>}
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </section>}
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={open => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none" onInteractOutside={e => e.preventDefault()}>
          <div className="bg-white/95 rounded-lg border p-4 shadow-lg relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 bg-muted/30 rounded-lg p-4 flex flex-col items-center justify-center relative">
                <div className="overflow-hidden relative h-[400px] w-full flex items-center justify-center">
                  {selectedImage && <img src={selectedImage.previewUrl} alt="معاينة موسعة" className="object-contain transition-transform duration-200" style={{
                  transform: `scale(${zoomLevel})`,
                  maxHeight: '100%',
                  maxWidth: '100%'
                }} />}
                </div>
                <div className="absolute top-2 left-2 flex gap-2">
                  <Button variant="secondary" size="icon" onClick={handleZoomIn} className="h-8 w-8 bg-white/90 hover:bg-white">
                    <ZoomIn size={16} />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={handleZoomOut} className="h-8 w-8 bg-white/90 hover:bg-white">
                    <ZoomOut size={16} />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={handleResetZoom} className="h-8 w-8 bg-white/90 hover:bg-white">
                    <Maximize2 size={16} />
                  </Button>
                </div>
                {selectedImage && selectedImage.number !== undefined && <div className="absolute top-2 right-2 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
                    صورة {selectedImage.number}
                  </div>}
              </div>
              
              <div className="col-span-1">
                {selectedImage && <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">تفاصيل الصورة</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedImage.date)}
                      </p>
                    </div>
                    
                    {selectedImage.confidence !== undefined && <div className="bg-blue-50 p-2 rounded-md mb-4">
                        <p className="text-sm text-blue-800">
                          دقة الاستخراج: {Math.round(selectedImage.confidence)}%
                        </p>
                      </div>}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">الكود:</label>
                        <input type="text" value={selectedImage.code || ""} onChange={e => handleTextChange(selectedImage.id, "code", e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">اسم المرسل:</label>
                        <input type="text" value={selectedImage.senderName || ""} onChange={e => handleTextChange(selectedImage.id, "senderName", e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">رقم الهاتف:</label>
                        <input type="text" value={selectedImage.phoneNumber || ""} onChange={e => handleTextChange(selectedImage.id, "phoneNumber", e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">المحافظة:</label>
                        <input type="text" value={selectedImage.province || ""} onChange={e => handleTextChange(selectedImage.id, "province", e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">السعر:</label>
                        <input type="text" value={selectedImage.price || ""} onChange={e => handleTextChange(selectedImage.id, "price", e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-brand-coral rtl-textarea" dir="rtl" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(selectedImage.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash size={14} className="ml-1" />
                        حذف
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Edit size={14} className="ml-1" />
                        تعديل
                      </Button>
                      
                      <Button variant="default" size="sm" className="bg-brand-green hover:bg-brand-green/90 text-white" disabled={selectedImage.status !== "completed" || isSubmitting || selectedImage.submitted} onClick={() => handleSubmitToApi(selectedImage.id)}>
                        <Send size={14} className="ml-1" />
                        إرسال
                      </Button>
                    </div>
                  </div>}
              </div>
            </div>
            
            <DialogClose className="absolute top-2 right-2 rounded-full h-8 w-8 flex items-center justify-center border bg-background">
              <X size={18} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};

export default Index;
