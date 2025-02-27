
import { createWorker } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(file: File): Promise<OcrResult> {
  try {
    const worker = await createWorker('ara');
    
    // Convert File to image data
    const imageData = await fileToImageData(file);
    
    // Recognize text
    const { data } = await worker.recognize(imageData);
    
    await worker.terminate();
    
    return {
      text: data.text,
      confidence: data.confidence
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Helper function to convert File to image data
async function fileToImageData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to image data'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
