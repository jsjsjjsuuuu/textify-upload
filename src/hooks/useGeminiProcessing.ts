
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64 } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

export const useGeminiProcessing = () => {
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

  const processWithGemini = async (file: File, image: ImageData, fallbackProcessor: (file: File, image: ImageData) => Promise<ImageData>): Promise<ImageData> => {
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("Using Gemini API key of length:", geminiApiKey.length);

    // في بيئة المعاينة، استخدم المعالج الاحتياطي مباشرة بسبب قيود CORS
    if (isPreviewEnvironment()) {
      console.log("Running in preview environment (Lovable). Using fallback processor instead of Gemini due to CORS restrictions.");
      toast({
        title: "تنبيه",
        description: "استخدام OCR التقليدي في بيئة المعاينة بسبب قيود CORS",
        variant: "default"
      });
      return fallbackProcessor(file, image);
    }

    try {
      console.log("Converting file to base64");
      const imageBase64 = await fileToBase64(file);
      console.log("File converted to base64, length:", imageBase64.length);
      
      console.log("Calling extractDataWithGemini");
      const extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true
      });
      console.log("Gemini extraction result:", extractionResult);
      
      if (extractionResult.success && extractionResult.data) {
        const { parsedData, extractedText } = extractionResult.data;
        
        // تحقق من وجود بيانات تم استخراجها
        if (parsedData && Object.keys(parsedData).length > 0) {
          console.log("Gemini successfully extracted data:", parsedData);
          
          toast({
            title: "تم الاستخراج بنجاح",
            description: "تم استخراج البيانات باستخدام Gemini AI",
          });

          return updateImageWithExtractedData(
            image,
            extractedText || "",
            parsedData || {},
            95,
            "gemini"
          );
        } else {
          console.log("Gemini returned empty data, falling back to OCR");
          
          toast({
            title: "تنبيه",
            description: "لم يتم استخراج بيانات من Gemini، جاري استخدام OCR التقليدي",
            variant: "default"
          });
          
          return fallbackProcessor(file, image);
        }
      } else {
        console.log("Gemini extraction failed, falling back to OCR");
        
        toast({
          title: "تنبيه",
          description: "تم استخدام OCR التقليدي بسبب: " + extractionResult.message,
          variant: "default"
        });
        
        return fallbackProcessor(file, image);
      }
    } catch (geminiError) {
      console.error("Error in Gemini processing:", geminiError);
      
      toast({
        title: "تنبيه",
        description: "تم استخدام OCR التقليدي بسبب خطأ في Gemini",
        variant: "default"
      });
      
      return fallbackProcessor(file, image);
    }
  };

  return { useGemini, processWithGemini };
};
