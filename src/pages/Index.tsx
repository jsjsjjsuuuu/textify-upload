
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog } from "@/components/ui/dialog";
import { extractTextFromImage } from "@/lib/ocrService";
import { submitTextToApi, extractDataWithGemini, fileToBase64 } from "@/lib/apiService";
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import { ImageData } from "@/types/ImageData";

const Index = () => {
  const [images, setImages] = useState<ImageData[]>([]);
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

  return (
    <div className="relative min-h-screen pb-20">
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
          <ImageUploader 
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            useGemini={useGemini}
            onFileChange={handleFileChange}
          />

          <ImageList 
            images={sortedImages}
            isSubmitting={isSubmitting}
            onImageClick={handleImageClick}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
            onSubmit={handleSubmitToApi}
            formatDate={formatDate}
          />

          <ImageTable 
            images={sortedImages}
            isSubmitting={isSubmitting}
            onImageClick={handleImageClick}
            onDelete={handleDelete}
            onSubmit={handleSubmitToApi}
            formatDate={formatDate}
          />
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={open => !open && setSelectedImage(null)}>
        <ImagePreviewDialog 
          selectedImage={selectedImage}
          zoomLevel={zoomLevel}
          isSubmitting={isSubmitting}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onTextChange={handleTextChange}
          onDelete={handleDelete}
          onSubmit={handleSubmitToApi}
          formatDate={formatDate}
        />
      </Dialog>
    </div>
  );
};

export default Index;
