
import { ImageData } from "@/types/ImageData";

/**
 * Attempts to parse structured data from OCR text
 */
export const parseDataFromOCRText = (text: string) => {
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

/**
 * Updates an image with extracted data
 */
export const updateImageWithExtractedData = (
  image: ImageData, 
  extractedText: string, 
  parsedData: Record<string, string>,
  confidence: number = 0,
  method: "ocr" | "gemini" = "ocr"
): ImageData => {
  return {
    ...image,
    extractedText,
    confidence,
    code: parsedData.code || "",
    senderName: parsedData.senderName || "",
    phoneNumber: parsedData.phoneNumber || "",
    province: parsedData.province || "",
    price: parsedData.price || "",
    status: "completed",
    extractionMethod: method
  };
};
