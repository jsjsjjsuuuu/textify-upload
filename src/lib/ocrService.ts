
import { createWorker, WorkerOptions } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(file: File): Promise<OcrResult> {
  console.log("Starting OCR extraction process for file:", file.name);
  try {
    // Create worker with proper options for Arabic language
    console.log("Creating Tesseract worker...");
    const worker = await createWorker();
    console.log("Worker created successfully");
    
    // We need to initialize with Arabic language
    console.log("Loading Arabic language...");
    await worker.loadLanguage('ara');
    console.log("Initializing worker with Arabic...");
    await worker.initialize('ara');
    console.log("Worker initialized successfully");
    
    // Convert File to image data
    console.log("Converting file to image data...");
    const imageData = await fileToImageData(file);
    console.log("File converted to image data successfully");
    
    // Recognize text
    console.log("Starting text recognition...");
    const { data } = await worker.recognize(imageData);
    console.log("Text recognition completed with confidence:", data.confidence);
    
    await worker.terminate();
    console.log("Worker terminated");
    
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
        console.log("File read successful, image data length:", reader.result.length);
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to image data'));
      }
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
}
