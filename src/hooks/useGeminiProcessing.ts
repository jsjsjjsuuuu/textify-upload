
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useGemini } from "./useGemini";
import { useTesseract } from "./useTesseract";
import { useImageStore } from "@/store/imageStore";

interface GeminiExtractionResult {
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  companyName?: string;
  price?: string;
  rawText?: string;
  confidence?: number;
  extractionSuccess?: boolean | string;
  recipientName?: string;
  notes?: string;
  delegateName?: string;
  packageType?: string;
  pieceCount?: string;
}

/**
 * هوك مخصص لمعالجة الصور باستخدام Gemini API و Tesseract OCR كبديل
 */
export const useGeminiProcessing = () => {
  const { toast } = useToast();
  const { setImageData } = useImageStore();
  const { geminiExtractData } = useGemini();
  const { tesseractExtract } = useTesseract();
  const [isGeminiProcessing, setIsGeminiProcessing] = useState(false);
  const [geminiProcessingError, setGeminiProcessingError] = useState<string | null>(null);

  /**
   * دالة لمعالجة صورة باستخدام Gemini API ثم Tesseract كبديل إذا فشل Gemini
   */
  const processImage = useCallback(async (image: ImageData) => {
    setIsGeminiProcessing(true);
    setGeminiProcessingError(null);

    try {
      // استخراج البيانات باستخدام Gemini
      const geminiResult = await geminiExtractData(image.previewUrl || "", image.id);

      if (geminiResult && (geminiResult.extractionSuccess === true || geminiResult.extractionSuccess === "true")) {
        // إذا نجح Gemini، قم بتحديث بيانات الصورة
        handleGeminiSuccess(image.id, geminiResult);
        showToasts(geminiResult);
      } else {
        // إذا فشل Gemini، استخدم Tesseract كبديل
        console.warn("Gemini extraction failed, attempting Tesseract OCR as fallback.");
        const tesseractResult = await tesseractExtract(image.file, image.id);

        if (tesseractResult && tesseractResult.success) {
          // إذا نجح Tesseract، قم بتحديث بيانات الصورة
          handleTesseractSuccess(image.id, tesseractResult.text);
          showToasts(geminiResult, true);
        } else {
          // إذا فشل كل من Gemini و Tesseract، قم بتعيين حالة الخطأ
          handleExtractionError(image.id, "فشل استخراج البيانات باستخدام Gemini و Tesseract.");
          setGeminiProcessingError("فشل استخراج البيانات باستخدام Gemini و Tesseract.");
          toast({
            title: "فشل استخراج البيانات",
            description: "فشل استخراج البيانات باستخدام Gemini و Tesseract.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      // التعامل مع أي أخطاء تحدث أثناء المعالجة
      console.error("Error processing image:", error);
      handleExtractionError(image.id, `حدث خطأ أثناء معالجة الصورة: ${error.message}`);
      setGeminiProcessingError(`حدث خطأ أثناء معالجة الصورة: ${error.message}`);
      toast({
        title: "خطأ في المعالجة",
        description: `حدث خطأ أثناء معالجة الصورة: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGeminiProcessing(false);
    }
  }, [geminiExtractData, tesseractExtract, setImageData, toast]);

  /**
   * دالة مساعدة للتعامل مع النجاح في استخراج البيانات باستخدام Gemini
   */
  const handleGeminiSuccess = (imageId: string, result: GeminiExtractionResult, parsedText?: string) => {
    // تصحيح أرقام الهواتف
    let formattedPhone = result.phoneNumber;
    if (result.phoneNumber && !result.phoneNumber.startsWith("07")) {
      formattedPhone = "07" + result.phoneNumber;
    }

    // تصحيح أسماء المحافظات
    let correctedProvince = result.province;
    if (result.province === "كركوك") {
      correctedProvince = "تأميم";
    }

    // تعديل نوع البيانات من string إلى boolean
    const extractionSuccess = result.extractionSuccess === true || result.extractionSuccess === "true";

    setImageData(prev =>
      prev.map(img =>
        img.id === imageId
          ? {
              ...img,
              status: "completed",
              extractedText: parsedText || result.rawText || img.extractedText,
              code: result.code || img.code,
              senderName: result.senderName || img.senderName,
              phoneNumber: formattedPhone || img.phoneNumber,
              province: correctedProvince || img.province,
              companyName: result.companyName || img.companyName,
              price: result.price || img.price,
              confidence: result.confidence || img.confidence,
              extractionMethod: "gemini",
              extractionSuccess: extractionSuccess,
              // تعديلات إضافية للحقول الجديدة
              recipientName: result.recipientName || img.recipientName,
              notes: result.notes || img.notes,
              delegateName: result.delegateName || img.delegateName,
              packageType: result.packageType || img.packageType,
              pieceCount: result.pieceCount || img.pieceCount
            }
          : img
      )
    );
  };

  /**
   * دالة مساعدة للتعامل مع النجاح في استخراج البيانات باستخدام Tesseract
   */
  const handleTesseractSuccess = (imageId: string, text: string) => {
    setImageData(prev =>
      prev.map(img =>
        img.id === imageId
          ? {
              ...img,
              status: "completed",
              extractedText: text,
              extractionMethod: "ocr",
              extractionSuccess: true
            }
          : img
      )
    );
  };

  /**
   * دالة مساعدة للتعامل مع أخطاء استخراج البيانات
   */
  const handleExtractionError = (imageId: string, errorMessage: string) => {
    setImageData(prev =>
      prev.map(img =>
        img.id === imageId
          ? {
              ...img,
              status: "error",
              bookmarkletMessage: errorMessage,
              extractionSuccess: false
            }
          : img
      )
    );
  };

  /**
   * دالة مساعدة لعرض الإشعارات بناءً على نتيجة استخراج البيانات
   */
  const showToasts = (result: GeminiExtractionResult, isTesseractFallback: boolean = false) => {
    if (result && result.extractionSuccess) {
      const extractionSuccess = result.extractionSuccess === true || result.extractionSuccess === "true";

      if (extractionSuccess) {
        toast({
          title: `تم استخراج البيانات ${isTesseractFallback ? 'باستخدام OCR كبديل' : ''}`,
          description: "تم استخراج البيانات بنجاح",
          variant: "default", // تم تغيير "success" إلى "default"
        });
        return;
      }
    }

    // إصلاح الفحص هنا أيضًا
    const extractionSuccess = result.extractionSuccess === true || result.extractionSuccess === "true";

    if (!extractionSuccess) {
      toast({
        title: `تم استخراج بعض البيانات ${isTesseractFallback ? 'باستخدام OCR' : ''}`,
        description: "قد تحتاج لمراجعة وتصحيح البيانات المستخرجة",
        variant: "default", // تم تغيير "warning" إلى "default"
      });
    }
  };

  return {
    processImage,
    isGeminiProcessing,
    geminiProcessingError,
  };
};
