

export interface ApiResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface TextSubmission {
  imageId: string;
  text: string;
  source: string;
  date: string;
}

/**
 * Convert a file to base64 encoded string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log("File converted to base64 successfully, length:", reader.result.length);
        resolve(reader.result);
      } else {
        console.error("FileReader did not return a string");
        reject(new Error("FileReader did not return a string"));
      }
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Mock function to simulate sending data to an external API
 * In a real application, this would make an actual HTTP request to your backend
 */
export async function submitTextToApi(data: TextSubmission): Promise<ApiResult> {
  console.log("Submitting data to API:", data);
  
  // Simulate API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          message: "تم إرسال البيانات بنجاح",
          data: {
            id: `submission-${Date.now()}`,
            status: "processed",
            timestamp: new Date().toISOString()
          }
        });
      } else {
        resolve({
          success: false,
          message: "فشل في إرسال البيانات إلى الخادم"
        });
      }
    }, 1500);
  });
}

/**
 * In a real application, you would implement actual API integrations
 * For example, connecting to a specific website or service API
 */
export async function authenticateWithExternalApi(apiKey: string): Promise<ApiResult> {
  // This would be a real API call in production
  return new Promise((resolve) => {
    setTimeout(() => {
      if (apiKey && apiKey.length > 5) {
        resolve({
          success: true,
          message: "تم التحقق من مفتاح API بنجاح",
          data: {
            token: "mock-jwt-token-" + Date.now(),
            expiresIn: 3600
          }
        });
      } else {
        resolve({
          success: false,
          message: "مفتاح API غير صالح"
        });
      }
    }, 1000);
  });
}

// تصدير الدوال من geminiService
export * from './geminiService';
export { createBookmarkletCode, createBatchBookmarkletCode } from './gemini';

