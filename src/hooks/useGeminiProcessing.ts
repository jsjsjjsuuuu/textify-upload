
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64 } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";

// Maximum number of retry attempts for Gemini processing
const MAX_RETRY_ATTEMPTS = 3;

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

  /**
   * Processes an image with Gemini API with retry logic
   */
  const processWithGemini = async (
    file: File, 
    image: ImageData, 
    fallbackProcessor: (file: File, image: ImageData) => Promise<ImageData>
  ): Promise<ImageData> => {
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("Using Gemini API key of length:", geminiApiKey.length);

    let retryCount = 0;
    let lastError: unknown = null;

    // Convert file to base64 outside the retry loop to avoid redundant conversion
    let imageBase64: string;
    try {
      console.log("Converting file to base64");
      imageBase64 = await fileToBase64(file);
      console.log("File converted to base64, length:", imageBase64.length);
    } catch (error) {
      console.error("Error converting file to base64:", error);
      toast({
        title: "خطأ في تحويل الملف",
        description: "فشل في تحويل الصورة، يتم الانتقال إلى OCR التقليدي",
        variant: "destructive"
      });
      return fallbackProcessor(file, image);
    }

    // Retry loop for Gemini processing
    while (retryCount < MAX_RETRY_ATTEMPTS) {
      try {
        console.log(`Gemini processing attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}`);
        
        const extractionResult = await extractDataWithGemini({
          apiKey: geminiApiKey,
          imageBase64,
          temperature: 0.2 + (retryCount * 0.1) // Slightly increase temperature with each retry
        });
        
        console.log("Gemini extraction result:", extractionResult);
        
        if (extractionResult.success && extractionResult.data) {
          const { parsedData, extractedText } = extractionResult.data;
          
          if (!extractedText || extractedText.trim() === "") {
            console.log("Empty text returned from Gemini, retrying...");
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Backoff
            continue;
          }
          
          toast({
            title: "تم الاستخراج بنجاح",
            description: `تم استخراج البيانات باستخدام Gemini AI ${retryCount > 0 ? `(بعد ${retryCount} محاولات)` : ''}`,
          });

          return updateImageWithExtractedData(
            image,
            extractedText || "",
            parsedData || {},
            95,
            "gemini"
          );
        } else {
          console.log(`Gemini extraction failed (attempt ${retryCount + 1}), reason:`, extractionResult.message);
          lastError = new Error(extractionResult.message);
          retryCount++;
          
          if (retryCount < MAX_RETRY_ATTEMPTS) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      } catch (error) {
        console.error(`Error in Gemini processing (attempt ${retryCount + 1}):`, error);
        lastError = error;
        retryCount++;
        
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    // All retries failed, fall back to OCR
    console.log(`All ${MAX_RETRY_ATTEMPTS} Gemini attempts failed, falling back to OCR`);
    
    toast({
      title: "تنبيه",
      description: `تم استخدام OCR التقليدي بعد ${MAX_RETRY_ATTEMPTS} محاولات فاشلة مع Gemini`,
      variant: "default"
    });
    
    return fallbackProcessor(file, image);
  };

  return { useGemini, processWithGemini };
};
