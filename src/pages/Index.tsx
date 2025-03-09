
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
    
    // Always set a default API key if none exists
    if (!geminiApiKey) {
      const defaultApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      localStorage.setItem("geminiApiKey", defaultApiKey);
      console.log("Set default Gemini API key:", defaultApiKey);
      setUseGemini(true);
    } else {
      console.log("Using existing Gemini API key of length:", geminiApiKey.length);
      setUseGemini(true);
    }
  }, []);

  const handleFileChange = async (files: FileList | null) => {
    console.log("handleFileChange called with files:", files);
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    console.log("Processing", fileArray.length, "files");
    
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("Using Gemini API key of length:", geminiApiKey.length);

    const startingNumber = images.length > 0 ? Math.max(...images.map(img => img.number || 0)) + 1 : 1;
    console.log("Starting number for new images:", startingNumber);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      console.log("Processing file:", file.name, "type:", file.type);
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى تحميل صور فقط",
          variant: "destructive"
        });
        console.log("File is not an image, skipping");
        continue;
      }
      
      const previewUrl = URL.createObjectURL(file);
      console.log("Created preview URL:", previewUrl);
      
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
      console.log("Added new image to state with ID:", newImage.id);
      
      try {
        if (geminiApiKey) {
          console.log("Using Gemini API for extraction");
          try {
            console.log("Converting file to base64");
            const imageBase64 = await fileToBase64(file);
            console.log("File converted to base64, length:", imageBase64.length);
            
            console.log("Calling extractDataWithGemini");
            const extractionResult = await extractDataWithGemini({
              apiKey: geminiApiKey,
              imageBase64
            });
            console.log("Gemini extraction result:", extractionResult);
            
            if (extractionResult.success && extractionResult.data) {
              const { parsedData, extractedText } = extractionResult.data;
              
              // Ensure the data is properly formatted before updating state
              const updatedImage = {
                ...newImage,
                extractedText: extractedText || "",
                confidence: 95,
                code: parsedData?.code || "",
                senderName: parsedData?.senderName || "",
                phoneNumber: parsedData?.phoneNumber || "",
                province: parsedData?.province || "",
                price: parsedData?.price || "",
                status: "completed" as const
              };
              
              console.log("Updating image with extracted data:", updatedImage);
              
              setImages(prev => 
                prev.map(img => img.id === newImage.id ? updatedImage : img)
              );

              toast({
                title: "تم الاستخراج بنجاح",
                description: "تم استخراج البيانات باستخدام Gemini AI",
              });
            } else {
              console.log("Gemini extraction failed, falling back to OCR");
              await fallbackToOCR(file, newImage);
              
              toast({
                title: "تنبيه",
                description: "تم استخدام OCR التقليدي بسبب: " + extractionResult.message,
                variant: "default"
              });
            }
          } catch (geminiError) {
            console.error("Error in Gemini processing:", geminiError);
            console.log("Falling back to OCR due to Gemini error");
            await fallbackToOCR(file, newImage);
            
            toast({
              title: "تنبيه",
              description: "تم استخدام OCR التقليدي بسبب خطأ في Gemini",
              variant: "default"
            });
          }
        } else {
          console.log("No Gemini API key, using OCR directly");
          await fallbackToOCR(file, newImage);
        }
      } catch (error) {
        console.error("General error in image processing:", error);
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
      const progress = Math.round(processedFiles / totalFiles * 100);
      console.log("Processing progress:", progress + "%");
      setProcessingProgress(progress);
    }
    
    setIsProcessing(false);
    console.log("Image processing completed");
    
    if (processedFiles > 0) {
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${processedFiles} صورة${geminiApiKey ? " باستخدام Gemini AI" : ""}`,
        variant: "default"
      });
    }
  };

  // OCR fallback function
  const fallbackToOCR = async (file: File, newImage: ImageData) => {
    try {
      console.log("Calling extractTextFromImage for OCR");
      const result = await extractTextFromImage(file);
      console.log("OCR result:", result);
      
      // Try to parse data from OCR text
      const extractedData = parseDataFromOCRText(result.text);
      console.log("Parsed data from OCR text:", extractedData);
      
      setImages(prev => prev.map(img => img.id === newImage.id ? {
        ...img,
        extractedText: result.text,
        confidence: result.confidence,
        code: extractedData.code || "",
        senderName: extractedData.senderName || "",
        phoneNumber: extractedData.phoneNumber || "",
        province: extractedData.province || "",
        price: extractedData.price || "",
        status: "completed"
      } : img));
    } catch (ocrError) {
      console.error("OCR processing error:", ocrError);
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
  };

  // Function to try to parse data from OCR text
  const parseDataFromOCRText = (text: string) => {
    console.log("Parsing data from OCR text:", text);
    const result: Record<string, string> = {};
    
    // Common patterns for data extraction
    const patterns = {
      code: [/كود[:\s]+([0-9]+)/i, /code[:\s]+([0-9]+)/i, /رقم[:\s]+([0-9]+)/i],
      senderName: [/اسم المرسل[:\s]+(.+?)(?:\n|\r|$)/i, /sender[:\s]+(.+?)(?:\n|\r|$)/i, /الاسم[:\s]+(.+?)(?:\n|\r|$)/i],
      phoneNumber: [/هاتف[:\s]+([0-9\-]+)/i, /phone[:\s]+([0-9\-]+)/i, /جوال[:\s]+([0-9\-]+)/i, /رقم الهاتف[:\s]+([0-9\-]+)/i],
      province: [/محافظة[:\s]+(.+?)(?:\n|\r|$)/i, /province[:\s]+(.+?)(?:\n|\r|$)/i, /المدينة[:\s]+(.+?)(?:\n|\r|$)/i],
      price: [/سعر[:\s]+(.+?)(?:\n|\r|$)/i, /price[:\s]+(.+?)(?:\n|\r|$)/i, /المبلغ[:\s]+(.+?)(?:\n|\r|$)/i]
    };
    
    // Try to match each field
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result[field] = match[1].trim();
          break;
        }
      }
    }
    
    // Also try to look for JSON in the text
    try {
      const jsonMatch = text.match(/{[\s\S]*?}/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[0]);
          // Merge any valid data from JSON with existing results
          if (jsonData.code) result.code = jsonData.code;
          if (jsonData.senderName) result.senderName = jsonData.senderName;
          if (jsonData.phoneNumber) result.phoneNumber = jsonData.phoneNumber;
          if (jsonData.province) result.province = jsonData.province;
          if (jsonData.price) result.price = jsonData.price;
        } catch (e) {
          console.log("Failed to parse JSON from text:", e);
        }
      }
    } catch (e) {
      console.log("Error looking for JSON in text:", e);
    }
    
    return result;
  };

  const handleTextChange = (id: string, field: string, value: string) => {
    console.log(`Updating ${field} to "${value}" for image ${id}`);
    
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
        description: "حدث خطأ أثناء الاتصال بالخادم",
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
