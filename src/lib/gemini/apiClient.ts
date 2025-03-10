
import { GeminiRequest, GeminiResponse } from './types';
import { getGeminiEndpoint, REQUEST_TIMEOUT } from './config';

/**
 * Makes a request to the Gemini API with timeout handling
 */
export async function makeGeminiRequest(
  apiKey: string, 
  requestBody: GeminiRequest,
  modelVersion: string
): Promise<{ response: Response; data?: GeminiResponse }> {
  const endpoint = getGeminiEndpoint(modelVersion);
  
  // Add timeout for the request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    console.log("Gemini API Response status:", response.status);
    
    if (response.ok) {
      const data: GeminiResponse = await response.json();
      return { response, data };
    }
    
    return { response };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validates response from Gemini API
 */
export function validateGeminiResponse(data: GeminiResponse): boolean {
  if (data.promptFeedback?.blockReason) {
    return false;
  }
  
  if (!data.candidates || data.candidates.length === 0) {
    return false;
  }
  
  const extractedText = data.candidates[0].content.parts[0].text;
  return !(!extractedText || extractedText.trim() === "");
}

